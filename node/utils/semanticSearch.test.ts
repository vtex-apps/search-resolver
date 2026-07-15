import { buildSemanticSearchParams } from './semanticSearch'

describe('buildSemanticSearchParams', () => {
  it('returns an empty object when hybrid search is disabled', () => {
    expect(buildSemanticSearchParams(false)).toEqual({})
  })

  it('returns { semanticRatio } when hybrid search is enabled', () => {
    expect(buildSemanticSearchParams(true)).toEqual({
      semanticRatio: 0.5,
    })
  })
})
