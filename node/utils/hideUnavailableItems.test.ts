import { applyHideUnavailableItemsDefaultForDP } from './hideUnavailableItems'

describe('applyHideUnavailableItemsDefaultForDP', () => {
  it('should preserve explicit hideUnavailableItems=true', () => {
    const args = { hideUnavailableItems: true }
    const segmentParams = { deliveryZonesHash: 'dzHash' }

    const result = applyHideUnavailableItemsDefaultForDP(args, segmentParams)

    expect(result.hideUnavailableItems).toBe(true)
  })

  it('should preserve explicit hideUnavailableItems=false', () => {
    const args = { hideUnavailableItems: false }
    const segmentParams = { deliveryZonesHash: 'dzHash' }

    const result = applyHideUnavailableItemsDefaultForDP(args, segmentParams)

    expect(result.hideUnavailableItems).toBe(false)
  })

  it('should preserve explicit hideUnavailableItems=null', () => {
    const args = { hideUnavailableItems: null }
    const segmentParams = { deliveryZonesHash: 'dzHash' }

    const result = applyHideUnavailableItemsDefaultForDP(args, segmentParams)

    expect(result.hideUnavailableItems).toBeNull()
  })

  it('should default to true when DP is enabled (deliveryZonesHash present) and hideUnavailableItems is undefined', () => {
    const args: { hideUnavailableItems?: boolean | null } = {}
    const segmentParams = { deliveryZonesHash: 'dzHash' }

    const result = applyHideUnavailableItemsDefaultForDP(args, segmentParams)

    expect(result.hideUnavailableItems).toBe(true)
  })

  it('should default to false when DP is disabled (no deliveryZonesHash) and hideUnavailableItems is undefined', () => {
    const args: { hideUnavailableItems?: boolean | null } = {}
    const segmentParams = {}

    const result = applyHideUnavailableItemsDefaultForDP(args, segmentParams)

    expect(result.hideUnavailableItems).toBe(false)
  })

  it('should default to false when segmentParams is null and hideUnavailableItems is undefined', () => {
    const args: { hideUnavailableItems?: boolean | null } = {}
    const segmentParams = null

    const result = applyHideUnavailableItemsDefaultForDP(args, segmentParams)

    expect(result.hideUnavailableItems).toBe(false)
  })

  it('should default to false when segmentParams is undefined and hideUnavailableItems is undefined', () => {
    const args: { hideUnavailableItems?: boolean | null } = {}

    const result = applyHideUnavailableItemsDefaultForDP(args, undefined)

    expect(result.hideUnavailableItems).toBe(false)
  })

  it('should not mutate the original args object', () => {
    const args: { hideUnavailableItems?: boolean | null; foo?: string } = {
      foo: 'bar',
    }
    const segmentParams = { deliveryZonesHash: 'dzHash' }

    const result = applyHideUnavailableItemsDefaultForDP(args, segmentParams)

    expect(result).not.toBe(args)
    expect(result.foo).toBe('bar')
    expect(result.hideUnavailableItems).toBe(true)
    expect(args).not.toHaveProperty('hideUnavailableItems')
  })
})
