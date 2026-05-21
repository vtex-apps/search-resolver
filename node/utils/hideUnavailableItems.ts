import type { SegmentParams } from './segment'

type HideUnavailableItemsCarrier = {
  hideUnavailableItems?: boolean | null
}

/**
 * Delivery Promise (DP) is considered enabled when the segment carries a
 * `deliveryZonesHash`. When the caller did not provide any value (`undefined`):
 * - DP on → `hideUnavailableItems: true`
 * - DP off → `hideUnavailableItems: false`
 *
 * Note: `null` is treated as an explicit value and is preserved.
 */
export function applyHideUnavailableItemsDefaultForDP<T extends HideUnavailableItemsCarrier>(
  args: T,
  segmentParams?: Pick<SegmentParams, 'deliveryZonesHash'> | null
): T {
  if (args.hideUnavailableItems !== undefined) {
    return args
  }

  return {
    ...args,
    hideUnavailableItems: Boolean(segmentParams?.deliveryZonesHash),
  }
}

