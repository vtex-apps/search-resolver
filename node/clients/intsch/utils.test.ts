import {
  filterByAllowedIntelligentSearchQueryKeys,
  filterUndefinedNonNull,
  shouldInjectDPPreview,
} from './utils'

describe('filterUndefinedNonNull', () => {
  it('drops undefined and null values', () => {
    expect(
      filterUndefinedNonNull({ a: 1, b: undefined, c: null, d: 'x' })
    ).toEqual({ a: 1, d: 'x' })
  })

  it('keeps falsy-but-meaningful values (false, "", 0)', () => {
    expect(filterUndefinedNonNull({ a: false, b: '', c: 0 })).toEqual({
      a: false,
      b: '',
      c: 0,
    })
  })
})

describe('filterByAllowedIntelligentSearchQueryKeys', () => {
  it('keeps known IS API query keys and drops unknown ones', () => {
    const result = filterByAllowedIntelligentSearchQueryKeys({
      query: 'shoes',
      foo: 'bar',
      regionId: 'r1',
    })
    expect(result).toEqual({ query: 'shoes', regionId: 'r1' })
  })

  it('accepts the DPT-67 dpPreview key on the allowlist', () => {
    const result = filterByAllowedIntelligentSearchQueryKeys({
      dpPreview: 'true',
      ignored: 'value',
    })
    expect(result).toEqual({ dpPreview: 'true' })
  })
})

/**
 * DPT-67: workspace-driven QA mode. The storefront emits `dpPreview=true` on
 * non-`master` workspaces so the IS API activates the Delivery Promises code
 * path without the store having to flip `deliveryPromisesEnabled`. Production
 * traffic in `master` must never carry the param.
 */
describe('shouldInjectDPPreview', () => {
  it('returns true for a typical QA workspace', () => {
    expect(shouldInjectDPPreview('qa-store')).toBe(true)
  })

  it('returns true for a dev workspace', () => {
    expect(shouldInjectDPPreview('dev')).toBe(true)
  })

  it('returns false for master', () => {
    expect(shouldInjectDPPreview('master')).toBe(false)
  })

  it('returns false when the workspace is undefined', () => {
    expect(shouldInjectDPPreview(undefined)).toBe(false)
  })

  it('returns false when the workspace is an empty string', () => {
    expect(shouldInjectDPPreview('')).toBe(false)
  })
})
