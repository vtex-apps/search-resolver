import type { SegmentParams } from './segment'

type HideUnavailableItemsCarrier = {
  hideUnavailableItems?: boolean | null
}

/**
 * When the caller did not provide any value (`undefined`):
 * - DP on (`deliveryZonesHash` present) → pass through unchanged
 * - DP off → `hideUnavailableItems: false`
 *
 * Note: `null` is treated as an explicit value and is preserved.
 */
export function applyHideUnavailableItemsDefaultForDP<T extends HideUnavailableItemsCarrier>(
  args: T,
  segmentParams?: Pick<SegmentParams, 'deliveryZonesHash'> | null
): T {
  if (
    args.hideUnavailableItems !== undefined ||
    segmentParams?.deliveryZonesHash
  ) {
    return args
  }

  return {
    ...args,
    hideUnavailableItems: false,
  }
}

