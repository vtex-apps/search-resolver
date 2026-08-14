import {
  filterByAllowedIntelligentSearchQueryKeys,
  filterUndefinedNonNull,
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
