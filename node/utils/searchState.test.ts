import { parseState } from './searchState'

describe('parseState', () => {
  it('should correctly parse empty state', () => {
    expect(parseState('')).toEqual({})
    expect(parseState(undefined)).toEqual({})
  })

  it('should return empty on invalid state', () => {
    expect(parseState('adsasd')).toEqual({})
    expect(parseState('4')).toEqual({})
  })

  it('should correctly parse state', () => {
    expect(parseState(JSON.stringify({ property: 'value' }))).toEqual({
      property: 'value',
    })
  })
})
