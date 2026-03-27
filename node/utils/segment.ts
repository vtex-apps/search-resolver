export type SegmentParams = {
  sc?: string | number
  regionId?: string
  country?: string
  locale?: string
  'zip-code'?: string
  coordinates?: string
  pickupPoint?: string
  deliveryZonesHash?: string
  pickupPointHash?: string
  /** Simulation / marketing (product-search v1) — camelCase matches query param names */
  utmSource?: string
  utmCampaign?: string
  utmiCampaign?: string
  /** Only when segment has a string campaign id (matches Rust segment deserialize_campaigns) */
  campaigns?: string
  priceTables?: string
}

/**
 * Returns the segment from ctx, falling back to the segment API if absent.
 * Matches Rust v0's get_or_create_segment: the segment is either decoded from
 * the request token or created via the segment API with account defaults.
 * Returns an empty object if the segment API call fails, so search is not blocked.
 */
export async function getOrCreateSegment(
  ctx: Context
): Promise<Record<string, any>> {
  if (ctx.vtex.segment) {
    return ctx.vtex.segment as Record<string, any>
  }

  try {
    return await ctx.clients.segment.getSegment()
  } catch (err) {
    ctx.vtex.logger.warn({
      message: 'Failed to fetch segment, proceeding without it',
      error: err,
    })

    return {}
  }
}

const SHIPPING_FACET_KEYS = new Set([
  'zip-code',
  'pickupPoint',
  'country',
  'coordinates',
  'deliveryZonesHash',
  'pickupPointsHash',
])

/**
 * Extracts segment-derived query params and extra path facets.
 * Parses the segment `facets` string to separate shipping/geo keys (sent as query params)
 * from general facets (returned as extraFacets for path concatenation).
 *
 * This is generic and covers all segment fields needed by both facets and product-search.
 */
export function extractSegmentData(segment: Record<string, any>): {
  segmentParams: SegmentParams
  extraFacets: SelectedFacet[]
} {
  const shipping: Record<string, string> = {}
  const extraFacets: SelectedFacet[] = []

  if (typeof segment.facets === 'string' && segment.facets) {
    const facetsStr: string = segment.facets

    for (const pair of facetsStr.split(';')) {
      const eqIdx = pair.indexOf('=')

      if (eqIdx < 0) continue

      const key = pair.slice(0, eqIdx)
      const value = pair.slice(eqIdx + 1)

      if (!key || !value) continue

      if (SHIPPING_FACET_KEYS.has(key)) {
        shipping[key] = value
      } else {
        extraFacets.push({ key, value })
      }
    }
  }

  return {
    segmentParams: {
      sc: segment.channel,
      regionId: segment.regionId,
      country: segment.countryCode ?? shipping.country,
      locale: segment.cultureInfo,
      'zip-code': shipping['zip-code'],
      coordinates: shipping.coordinates,
      pickupPoint: shipping.pickupPoint,
      deliveryZonesHash: shipping.deliveryZonesHash,
      pickupPointHash: shipping.pickupPointsHash,
      utmSource: segment.utm_source ?? undefined,
      utmCampaign: segment.utm_campaign ?? undefined,
      utmiCampaign: segment.utmi_campaign ?? undefined,
      campaigns:
        typeof segment.campaigns === 'string' ? segment.campaigns : undefined,
      priceTables: segment.priceTables ?? undefined,
    },
    extraFacets,
  }
}
