import {
  fetchAutocompleteSuggestions,
  fetchTopSearches,
  fetchSearchSuggestions,
  fetchCorrection,
} from './autocomplete'
import { createContext } from '../mocks/contextFactory'

describe('fetchAutocompleteSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.skip('should call intsch as primary and return its result when successful', async () => {
    const intschResult = {
      searches: [{ term: 'test', count: 1 }],
    }

    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchAutocompleteSuggestions: {
          searches: [{ term: 'fallback', count: 2 }],
        },
      },
      intschSettings: {
        fetchAutocompleteSuggestions: intschResult,
      },
    })

    const result = await fetchAutocompleteSuggestions(ctx, 'test')

    expect(
      ctx.clients.intsch.fetchAutocompleteSuggestions
    ).toHaveBeenCalledWith({
      query: 'test',
    })
    expect(
      ctx.clients.intelligentSearchApi.fetchAutocompleteSuggestions
    ).not.toHaveBeenCalled()

    expect(result).toEqual(intschResult)
    expect(ctx.vtex.logger.warn).not.toHaveBeenCalled()
  })

  it('should use fallback when intelligentSearchApi fails', async () => {
    const fallbackResult = {
      searches: [{ term: 'fallback-result', count: 1 }],
    }

    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchAutocompleteSuggestions: new Error(
          'IntelligentSearchApi service unavailable'
        ),
      },
      intschSettings: {
        fetchAutocompleteSuggestionsV1: fallbackResult,
      },
    })

    const response = await fetchAutocompleteSuggestions(ctx, 'test')

    expect(
      ctx.clients.intelligentSearchApi.fetchAutocompleteSuggestions
    ).toHaveBeenCalledWith({
      query: 'test',
    })
    expect(
      ctx.clients.intsch.fetchAutocompleteSuggestionsV1
    ).toHaveBeenCalledWith({
      query: 'test',
      locale: undefined,
    })

    expect(response).toEqual(fallbackResult)
  })

  it('should throw error when both services fail', async () => {
    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchAutocompleteSuggestions: new Error('Primary service unavailable'),
      },
      intschSettings: {
        fetchAutocompleteSuggestionsV1: new Error(
          'Fallback service also unavailable'
        ),
      },
    })

    await expect(fetchAutocompleteSuggestions(ctx, 'test')).rejects.toThrow(
      'Both calls resulted in errors'
    )

    expect(
      ctx.clients.intelligentSearchApi.fetchAutocompleteSuggestions
    ).toHaveBeenCalledWith({
      query: 'test',
    })
    expect(
      ctx.clients.intsch.fetchAutocompleteSuggestionsV1
    ).toHaveBeenCalledWith({
      query: 'test',
      locale: undefined,
    })
  })

  it('should use locale from segment cultureInfo when available', async () => {
    const fallbackResult = {
      searches: [{ term: 'test-result', count: 1 }],
    }

    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchAutocompleteSuggestions: new Error(
          'IntelligentSearchApi unavailable'
        ),
      },
      intschSettings: {
        fetchAutocompleteSuggestionsV1: fallbackResult,
      },
      segment: {
        campaigns: null,
        channel: '1',
        priceTables: null,
        utm_campaign: null,
        utm_source: null,
        utmi_campaign: null,
        currencyCode: 'BRL',
        currencySymbol: 'R$',
        countryCode: 'BRA',
        cultureInfo: 'pt-BR',
      },
      tenantLocale: 'en-US',
      vtexLocale: 'es-ES',
    })

    await fetchAutocompleteSuggestions(ctx, 'test')

    expect(
      ctx.clients.intsch.fetchAutocompleteSuggestionsV1
    ).toHaveBeenCalledWith({
      query: 'test',
      locale: 'pt-BR',
    })
  })

  it('should fallback to tenant locale when segment cultureInfo is not available', async () => {
    const fallbackResult = {
      searches: [{ term: 'test-result', count: 1 }],
    }

    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchAutocompleteSuggestions: new Error(
          'IntelligentSearchApi unavailable'
        ),
      },
      intschSettings: {
        fetchAutocompleteSuggestionsV1: fallbackResult,
      },
      segment: {
        campaigns: null,
        channel: '1',
        priceTables: null,
        utm_campaign: null,
        utm_source: null,
        utmi_campaign: null,
        currencyCode: 'USD',
        currencySymbol: '$',
        countryCode: 'USA',
        cultureInfo: '',
      },
      tenantLocale: 'en-US',
      vtexLocale: 'es-ES',
    })

    await fetchAutocompleteSuggestions(ctx, 'test')

    expect(
      ctx.clients.intsch.fetchAutocompleteSuggestionsV1
    ).toHaveBeenCalledWith({
      query: 'test',
      locale: 'en-US',
    })
  })

  it('should fallback to vtex locale when both segment cultureInfo and tenant locale are not available', async () => {
    const fallbackResult = {
      searches: [{ term: 'test-result', count: 1 }],
    }

    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchAutocompleteSuggestions: new Error(
          'IntelligentSearchApi unavailable'
        ),
      },
      intschSettings: {
        fetchAutocompleteSuggestionsV1: fallbackResult,
      },
      vtexLocale: 'es-ES',
    })

    await fetchAutocompleteSuggestions(ctx, 'test')

    expect(
      ctx.clients.intsch.fetchAutocompleteSuggestionsV1
    ).toHaveBeenCalledWith({
      query: 'test',
      locale: 'es-ES',
    })
  })
})

describe('fetchTopSearches', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call intelligentSearchApi as primary and return its result when successful', async () => {
    const apiResult = {
      searches: [{ term: 'popular', count: 10 }],
    }

    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchTopSearches: apiResult,
      },
      intschSettings: {
        fetchTopSearchesV1: {
          searches: [{ term: 'comparison', count: 5 }],
        },
      },
    })

    const result = await fetchTopSearches(ctx)

    expect(
      ctx.clients.intelligentSearchApi.fetchTopSearches
    ).toHaveBeenCalledWith()
    expect(ctx.clients.intsch.fetchTopSearchesV1).toHaveBeenCalledWith(
      undefined
    )

    expect(result).toEqual(apiResult)
  })

  it('should use fallback when intelligentSearchApi fails', async () => {
    const fallbackResult = {
      searches: [{ term: 'fallback-top', count: 3 }],
    }

    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchTopSearches: new Error('IntelligentSearchApi unavailable'),
      },
      intschSettings: {
        fetchTopSearchesV1: fallbackResult,
      },
    })

    const response = await fetchTopSearches(ctx)

    expect(
      ctx.clients.intelligentSearchApi.fetchTopSearches
    ).toHaveBeenCalledWith()
    expect(ctx.clients.intsch.fetchTopSearchesV1).toHaveBeenCalledWith(
      undefined
    )

    expect(response).toEqual(fallbackResult)
  })
})

describe('fetchSearchSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call intelligentSearchApi as primary and return its result when successful', async () => {
    const apiResult = {
      searches: [{ term: 'suggestion', count: 5 }],
    }

    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchSearchSuggestions: apiResult,
      },
      intschSettings: {
        fetchSearchSuggestionsV1: {
          searches: [{ term: 'comparison-suggestion', count: 2 }],
        },
      },
    })

    const result = await fetchSearchSuggestions(ctx, 'search')

    expect(
      ctx.clients.intelligentSearchApi.fetchSearchSuggestions
    ).toHaveBeenCalledWith({
      query: 'search',
    })
    expect(ctx.clients.intsch.fetchSearchSuggestionsV1).toHaveBeenCalledWith({
      query: 'search',
      locale: undefined,
    })

    expect(result).toEqual(apiResult)
  })

  it('should use fallback when intelligentSearchApi fails', async () => {
    const fallbackResult = {
      searches: [{ term: 'fallback-suggestion', count: 2 }],
    }

    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchSearchSuggestions: new Error('IntelligentSearchApi unavailable'),
      },
      intschSettings: {
        fetchSearchSuggestionsV1: fallbackResult,
      },
    })

    const response = await fetchSearchSuggestions(ctx, 'search')

    expect(
      ctx.clients.intelligentSearchApi.fetchSearchSuggestions
    ).toHaveBeenCalledWith({
      query: 'search',
    })
    expect(ctx.clients.intsch.fetchSearchSuggestionsV1).toHaveBeenCalledWith({
      query: 'search',
      locale: undefined,
    })

    expect(response).toEqual(fallbackResult)
  })
})

describe('fetchCorrection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call intelligentSearchApi as primary and return its result when successful', async () => {
    const apiResult = {
      correction: {
        text: 'text',
        highlighted: '<b>text</b>',
        misspelled: true,
        correction: true,
      },
    }

    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchCorrection: apiResult,
      },
      intschSettings: {
        fetchCorrectionV1: {
          correction: {
            text: 'comparison',
            highlighted: '<b>comparison</b>',
            misspelled: true,
            correction: true,
          },
        },
      },
    })

    const result = await fetchCorrection(ctx, 'test')

    expect(
      ctx.clients.intelligentSearchApi.fetchCorrection
    ).toHaveBeenCalledWith({
      query: 'test',
    })
    expect(ctx.clients.intsch.fetchCorrectionV1).toHaveBeenCalledWith({
      query: 'test',
      locale: undefined,
    })

    expect(result).toEqual(apiResult)
  })

  it('should use fallback when intelligentSearchApi fails', async () => {
    const fallbackResult = {
      correction: {
        text: 'fallback-correction',
        highlighted: '<b>fallback-correction</b>',
        misspelled: true,
        correction: true,
      },
    }

    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchCorrection: new Error('IntelligentSearchApi unavailable'),
      },
      intschSettings: {
        fetchCorrectionV1: fallbackResult,
      },
    })

    const response = await fetchCorrection(ctx, 'test')

    expect(
      ctx.clients.intelligentSearchApi.fetchCorrection
    ).toHaveBeenCalledWith({
      query: 'test',
    })
    expect(ctx.clients.intsch.fetchCorrectionV1).toHaveBeenCalledWith({
      query: 'test',
      locale: undefined,
    })

    expect(response).toEqual(fallbackResult)
  })

  it('should throw error when both services fail', async () => {
    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchCorrection: new Error('Primary correction unavailable'),
      },
      intschSettings: {
        fetchCorrectionV1: new Error('Fallback correction also unavailable'),
      },
    })

    await expect(fetchCorrection(ctx, 'test')).rejects.toThrow(
      'Both calls resulted in errors'
    )

    expect(
      ctx.clients.intelligentSearchApi.fetchCorrection
    ).toHaveBeenCalledWith({
      query: 'test',
    })
    expect(ctx.clients.intsch.fetchCorrectionV1).toHaveBeenCalledWith({
      query: 'test',
      locale: undefined,
    })
  })
})
