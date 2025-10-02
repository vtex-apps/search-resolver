import { compareApiResults } from '../utils/compareResults'

interface ProductIdentifier {
  field: 'id' | 'slug' | 'ean' | 'reference' | 'sku'
  value: string
}

interface FetchProductArgs {
  identifier: ProductIdentifier
  salesChannel?: string | number | null
  regionId?: string
  vtexSegment?: string
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
  const { identifier, salesChannel, vtexSegment } = args
  const { field, value } = identifier

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
  args: FetchProductArgs
): Promise<SearchProduct[]> {
  const { intsch } = ctx.clients
  const { identifier, salesChannel, regionId } = args
  const { field, value } = identifier

  // Get locale from context
  const locale = ctx.vtex.tenant?.locale || ctx.vtex.locale

  const product = await intsch.fetchProduct({
    field,
    value,
    salesChannel: salesChannel?.toString(),
    regionId,
    locale,
  })

  // intsch.fetchProduct returns a single SearchProduct, but we need to return an array
  // to match the search client interface
  return product ? [product] : []
}

/**
 * Builds vtex segment token for product fetching
 */

export function buildVtexSegment (
  vtexSegment?: SegmentData,
  tradePolicy?: number,
  regionId?: string | null
): string {
  const cookie = {
    regionId: regionId,
    channel: tradePolicy,
    utm_campaign: vtexSegment?.utm_campaign || '',
    utm_source: vtexSegment?.utm_source || '',
    utmi_campaign: vtexSegment?.utmi_campaign || '',
    currencyCode: vtexSegment?.currencyCode || '',
    currencySymbol: vtexSegment?.currencySymbol || '',
    countryCode: vtexSegment?.countryCode || '',
    cultureInfo: vtexSegment?.cultureInfo || '',
  }

  return btoa(JSON.stringify(cookie))
}

/**
 * Main product fetching function with compareApiResults implementation
 * Uses search client as primary and intsch.fetchProduct as secondary
 */
export async function fetchProduct(
  ctx: Context,
  args: FetchProductArgs
): Promise<SearchProduct[]> {
  const COMPARISON_SAMPLE_RATE = ctx.vtex.production ? 1 : 100 // 1% of requests will be compared in prod and 100% in dev

  return compareApiResults(
    () => fetchProductFromSearch(ctx, args),
    () => fetchProductFromIntsch(ctx, args),
    COMPARISON_SAMPLE_RATE,
    ctx.vtex.logger,
    {
      logPrefix: 'Product Fetching Comparison',
      args: {
        identifier: args.identifier,
        salesChannel: args.salesChannel,
        regionId: args.regionId,
      },
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
    identifier !== undefined &&
    identifier.field !== undefined &&
    identifier.value !== undefined &&
    ['id', 'slug', 'ean', 'reference', 'sku'].includes(identifier.field)
  )
}

export async function resolveProduct(
  ctx: Context,
  rawArgs: any
): Promise<SearchProduct | null> {
  const args =
    rawArgs && isValidProductIdentifier(rawArgs.identifier)
      ? rawArgs
      : { identifier: { field: 'slug', value: rawArgs.slug! } }

  if (!args.identifier) {
    throw new Error('No product identifier provided')
  }

  let cookie: SegmentData | undefined = ctx.vtex.segment
  const salesChannel = rawArgs.salesChannel || cookie?.channel || 1

  const vtexSegment =
    !cookie || (!cookie?.regionId && rawArgs.regionId)
      ? buildVtexSegment(cookie, salesChannel, rawArgs.regionId)
      : ctx.vtex.segmentToken

  const fetchArgs: FetchProductArgs = {
    identifier: args.identifier,
    salesChannel,
    regionId: rawArgs.regionId,
    vtexSegment,
  }

  try {
    const products = await fetchProduct(ctx, fetchArgs)

    if (!products || products.length === 0) {
      return null
    }

    const product = products[0]

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
