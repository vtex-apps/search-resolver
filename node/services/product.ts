import { compareApiResults } from '../utils/compareResults'
import { extractSegmentData, getOrCreateSegment } from '../utils/segment'
import { fetchAppSettings } from './settings'
import {
  CATALOG_IGNORED_DIFFERENCES,
  CATALOG_EXISTENCE_COMPARE_FIELDS,
} from './pdpConfig'

function isProductNotFoundError(error: unknown): boolean {
  const axiosError = error as {
    response?: { status?: number; data?: { code?: string } }
  }

  const status = axiosError.response?.status
  const code = axiosError.response?.data?.code

  return status === 404 || code === 'PRODUCT_NOT_FOUND'
}

async function fetchIntschProductOrNull(
  intsch: Context['clients']['intsch'],
  args: Parameters<Context['clients']['intsch']['fetchProduct']>[0],
  options?: Parameters<Context['clients']['intsch']['fetchProduct']>[1]
): Promise<SearchProduct | null> {
  try {
    const product = await intsch.fetchProduct(args, options)

    return product ?? null
  } catch (error) {
    if (isProductNotFoundError(error)) {
      return null
    }

    throw error
  }
}

export type ProductIdentifier = {
  field: 'id' | 'slug' | 'ean' | 'reference' | 'sku'
  value: string
}

export type ProductArgs = {
  slug?: string
  identifier?: ProductIdentifier
  regionId?: string
  salesChannel?: number
}

interface FetchProductArgs {
  identifier: ProductIdentifier
  salesChannel?: number | null
  regionId?: string
}

/**
 * Product service that extracts product fetching logic and implements compareApiResults
 * using search client as primary and intsch.fetchProduct as secondary
 */

/**
 * Fetches a product using the search client with different identifier types
 */
async function fetchProductFromSearch(
  ctx: Context,
  args: FetchProductArgs
): Promise<SearchProduct[]> {
  const { search } = ctx.clients
  const { identifier, salesChannel } = args
  const { field, value } = identifier
  const vtexSegment = ctx.vtex.segmentToken

  switch (field) {
    case 'id':
      return search.productById(value, vtexSegment, salesChannel)

    case 'slug':
      return search.product(value, vtexSegment, salesChannel)

    case 'ean':
      return search.productByEan(value, vtexSegment, salesChannel)

    case 'reference':
      return search.productByReference(value, vtexSegment, salesChannel)

    case 'sku':
      return search.productBySku(value, vtexSegment, salesChannel)

    default:
      throw new Error(`Unsupported product identifier field: ${field}`)
  }
}

/**
 * Fetches a product using the intsch client
 */
async function fetchProductFromIntsch(
  ctx: Context,
  args: FetchProductArgs,
  segmentData: ReturnType<typeof extractSegmentData>
): Promise<SearchProduct[]> {
  const { intsch } = ctx.clients
  const { identifier, salesChannel, regionId } = args
  const { field, value } = identifier

  const product = await fetchIntschProductOrNull(
    intsch,
    {
      field,
      value,
      salesChannel: salesChannel ? `${salesChannel}` : undefined,
      regionId,
      productOriginVtex: true,
    },
    { segmentParams: segmentData.segmentParams }
  )

  return product ? [product] : []
}

/**
 * Builds vtex segment token for product fetching
 */

export async function fetchProduct(
  ctx: Context,
  args: FetchProductArgs
): Promise<SearchProduct[]> {
  const { shouldUseNewPDPEndpoint } = await fetchAppSettings(ctx)

  // Get and create segment before calling intsch
  const segment = await getOrCreateSegment(ctx)

  if (segment && segment.channel === null) {
    ctx.vtex.logger.warn({
      message: 'Couldnt detect a sales channel',
    })
  }

  const segmentData = extractSegmentData(segment)

  // Check if current account should skip comparison and use intsch directly
  if (shouldUseNewPDPEndpoint) {
    ctx.translated = true

    return fetchProductFromIntsch(ctx, args, segmentData)
  }

  const existenceCompareFields = CATALOG_EXISTENCE_COMPARE_FIELDS
  const ignoredDifferences = CATALOG_IGNORED_DIFFERENCES

  return compareApiResults(
    () => fetchProductFromSearch(ctx, args),
    () => fetchProductFromIntsch(ctx, args, segmentData),
    ctx.vtex.production ? 1 : 100,
    ctx.vtex.logger,
    {
      logPrefix: 'Product',
      args: {
        field: args.identifier.field,
        value: args.identifier.value,
      },
      existenceCompareFields,
      ignoredDifferences,
    }
  )
}

/**
 * Helper function to validate product identifier
 */
export function isValidProductIdentifier(
  identifier: ProductIdentifier | undefined
): identifier is ProductIdentifier {
  return (
    identifier?.field !== undefined &&
    identifier.value !== undefined &&
    ['id', 'slug', 'ean', 'reference', 'sku'].includes(identifier.field)
  )
}

export async function resolveProduct(
  ctx: Context,
  rawArgs: ProductArgs
): Promise<SearchProduct | null> {
  const args =
    rawArgs && isValidProductIdentifier(rawArgs.identifier)
      ? rawArgs
      : { identifier: { field: 'slug', value: rawArgs.slug ?? '' } }

  if (!args.identifier?.value) {
    throw new Error('No product identifier provided')
  }

  const { salesChannel } = rawArgs

  const fetchArgs: FetchProductArgs = {
    identifier: args.identifier as ProductIdentifier,
    salesChannel,
    regionId: rawArgs.regionId,
  }

  try {
    const products = await fetchProduct(ctx, fetchArgs)

    if (!products || products.length === 0) {
      return null
    }

    const [product] = products

    return product
  } catch (error) {
    ctx.vtex.logger.error({
      message: 'Error fetching product',
      error: error.message,
      args: fetchArgs,
    })
    throw error
  }
}

export type ProductsByIdentifierArgs = {
  field: 'id' | 'ean' | 'reference' | 'sku'
  values: string[]
  salesChannel?: string | null
  regionId?: string | null
}

/**
 * Fetches multiple products by identifier using the search client
 */
async function fetchProductsByIdentifierFromSearch(
  ctx: Context,
  args: ProductsByIdentifierArgs
): Promise<SearchProduct[]> {
  const { search } = ctx.clients
  const { field, values, salesChannel } = args
  const vtexSegment = ctx.vtex.segmentToken

  switch (field) {
    case 'id':
      return search.productsById(values, vtexSegment, salesChannel)

    case 'ean':
      return search.productsByEan(values, vtexSegment, salesChannel)

    case 'reference':
      return search.productsByReference(values, vtexSegment, salesChannel)

    case 'sku':
      return search.productsBySku(values, vtexSegment, salesChannel)

    default:
      throw new Error(`Unsupported product identifier field: ${field}`)
  }
}

/**
 * Fetches multiple products by identifier using the intsch client
 */
async function fetchProductsByIdentifierFromIntsch(
  ctx: Context,
  args: ProductsByIdentifierArgs,
  segmentData: ReturnType<typeof extractSegmentData>
): Promise<SearchProduct[]> {
  const { intsch } = ctx.clients
  const { field, values, salesChannel, regionId } = args

  const productResults = await Promise.all(
    values.map((value) =>
      fetchIntschProductOrNull(
        intsch,
        {
          field,
          value,
          salesChannel: salesChannel ? `${salesChannel}` : undefined,
          regionId: regionId ?? undefined,
          productOriginVtex: true,
        },
        { segmentParams: segmentData.segmentParams }
      )
    )
  )

  return productResults.filter(
    (product): product is SearchProduct => product != null
  )
}

export async function resolveProductsByIdentifier(
  ctx: Context,
  args: ProductsByIdentifierArgs
): Promise<SearchProduct[]> {
  const { shouldUseNewPDPEndpoint } = await fetchAppSettings(ctx)

  // Get and create segment before calling intsch
  const segment = await getOrCreateSegment(ctx)
  const segmentData = extractSegmentData(segment)

  try {
    let products: SearchProduct[]

    // Check if current account should use intsch directly
    if (shouldUseNewPDPEndpoint) {
      products = await fetchProductsByIdentifierFromIntsch(
        ctx,
        args,
        segmentData
      )
    } else {
      products = await fetchProductsByIdentifierFromSearch(ctx, args)
    }

    return products
  } catch (error) {
    ctx.vtex.logger.error({
      message: 'Error fetching products by identifier',
      error: error.message,
      args,
    })
    throw error
  }
}
