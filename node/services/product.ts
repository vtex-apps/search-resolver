import { compareApiResults } from '../utils/compareResults'

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
  const { identifier, salesChannel, regionId, vtexSegment } = args
  const { field, value } = identifier

  // Get locale from context (fallback)
  const defaultLocale = ctx.vtex.tenant?.locale || ctx.vtex.locale

  // Default salesChannel from args
  let finalSalesChannel = salesChannel ? `${salesChannel}` : undefined
  let finalLocale = defaultLocale

  // Parse vtexSegment if available to extract locale and salesChannel
  if (vtexSegment) {
    try {
      const segmentData: SegmentData = JSON.parse(
        Buffer.from(vtexSegment, 'base64').toString()
      )

      // Use segment's salesChannel if available, otherwise use the provided one
      if (segmentData.channel) {
        finalSalesChannel = segmentData.channel
      }

      // Use segment's locale (cultureInfo) if available, otherwise use default
      if (segmentData.cultureInfo) {
        finalLocale = segmentData.cultureInfo
      }
    } catch (error) {
      // If parsing fails, continue with defaults
      ctx.vtex.logger.warn({
        message: 'Failed to parse vtexSegment token, using defaults',
        error: error.message,
        vtexSegment,
      })
    }
  }

  const product = await intsch.fetchProduct({
    field,
    value,
    salesChannel: finalSalesChannel?.toString(),
    regionId,
    locale: finalLocale,
  })

  // intsch.fetchProduct returns a single SearchProduct, but we need to return an array
  // to match the search client interface
  return product ? [product] : []
}

/**
 * Builds vtex segment token for product fetching
 */

export function buildVtexSegment({
  vtexSegment,
  salesChannel,
  regionId,
}: {
  vtexSegment?: SegmentData
  salesChannel?: string
  regionId?: string
}): string {
  const cookie = {
    regionId: regionId ?? vtexSegment?.regionId,
    channel: salesChannel || vtexSegment?.channel,
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
 * For specific accounts, skips comparison and uses intsch directly
 */
export async function fetchProduct(
  ctx: Context,
  args: FetchProductArgs
): Promise<SearchProduct[]> {
  const COMPARISON_SAMPLE_RATE = ctx.vtex.production ? 1 : 100 // 1% of requests will be compared in prod and 100% in dev

  // List of accounts that should use intsch directly without comparison
  const INTSCH_ONLY_ACCOUNTS = ['b2bstoreqa', 'biggy', 'diegob2b']

  // Check if current account should skip comparison and use intsch directly
  if (INTSCH_ONLY_ACCOUNTS.includes(ctx.vtex.account)) {
    return fetchProductFromIntsch(ctx, args)
  }

  return compareApiResults(
    () => fetchProductFromSearch(ctx, args),
    () => fetchProductFromIntsch(ctx, args),
    COMPARISON_SAMPLE_RATE,
    ctx.vtex.logger,
    {
      logPrefix: 'Product Details',
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
  rawArgs: ProductArgs
): Promise<SearchProduct | null> {
  const args =
    rawArgs && isValidProductIdentifier(rawArgs.identifier)
      ? rawArgs
      : { identifier: { field: 'slug', value: rawArgs.slug! } }

  if (!args.identifier) {
    throw new Error('No product identifier provided')
  }

  const cookie: SegmentData | undefined = ctx.vtex.segment as
    | SegmentData
    | undefined

  const { salesChannel } = rawArgs

  const vtexSegment =
    !cookie || (!cookie?.regionId && rawArgs.regionId)
      ? buildVtexSegment({
          vtexSegment: ctx.vtex.segment as SegmentData | undefined,
          salesChannel: rawArgs.salesChannel?.toString(),
          regionId: rawArgs.regionId,
        })
      : ctx.vtex.segmentToken

  const fetchArgs: FetchProductArgs = {
    identifier: args.identifier as ProductIdentifier,
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
