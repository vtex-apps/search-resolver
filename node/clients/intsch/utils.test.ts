import {
  filterByAllowedIntelligentSearchQueryKeys,
  filterUndefinedNonNull,
  segmentQueryParams,
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

describe('segmentQueryParams', () => {
  const segment = {
    sc: '2',
    regionId: 'v2.SEGMENT',
    priceTables: 'pl-001',
    country: 'CHL',
    utmSource: 'news',
    campaigns: 'camp-1',
  }

  it('lets explicit salesChannel win over segment sc', () => {
    expect(segmentQueryParams(segment, { salesChannel: '1' }).sc).toBe('1')
  })

  it('uses segment sc when salesChannel is absent', () => {
    expect(segmentQueryParams(segment).sc).toBe('2')
  })

  it('does not default sc to 1 when neither override nor segment has it', () => {
    expect(segmentQueryParams(undefined).sc).toBeUndefined()
    expect(segmentQueryParams({}).sc).toBeUndefined()
  })

  it('lets explicit regionId win over segment regionId', () => {
    expect(segmentQueryParams(segment, { regionId: 'v2.ARG' }).regionId).toBe(
      'v2.ARG'
    )
  })

  it('forwards priceTables and other simulation fields from the segment', () => {
    expect(segmentQueryParams(segment)).toEqual(
      expect.objectContaining({
        priceTables: 'pl-001',
        regionId: 'v2.SEGMENT',
        country: 'CHL',
        utmSource: 'news',
        campaigns: 'camp-1',
      })
    )
  })
})
