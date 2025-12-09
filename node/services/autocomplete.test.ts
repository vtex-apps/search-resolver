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

  it('should call intsch and return its result when successful', async () => {
    const intschResult = {
      searches: [{ term: 'test', count: 1 }],
    }

    const ctx = createContext({
      intschSettings: {
        fetchAutocompleteSuggestionsV1: intschResult,
      },
    })

    const result = await fetchAutocompleteSuggestions(ctx, 'test')

    expect(
      ctx.clients.intsch.fetchAutocompleteSuggestionsV1
    ).toHaveBeenCalledWith({
      query: 'test',
      locale: undefined,
    })

    expect(result).toEqual(intschResult)
  })

  it('should throw error when intsch fails', async () => {
    const ctx = createContext({
      intschSettings: {
        fetchAutocompleteSuggestionsV1: new Error('Service unavailable'),
      },
    })

    await expect(fetchAutocompleteSuggestions(ctx, 'test')).rejects.toThrow(
      'Service unavailable'
    )

    expect(
      ctx.clients.intsch.fetchAutocompleteSuggestionsV1
    ).toHaveBeenCalledWith({
      query: 'test',
      locale: undefined,
    })
  })

  it('should use locale from segment cultureInfo when available', async () => {
    const intschResult = {
      searches: [{ term: 'test-result', count: 1 }],
    }

    const ctx = createContext({
      intschSettings: {
        fetchAutocompleteSuggestionsV1: intschResult,
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
      intschSettings: {
        fetchAutocompleteSuggestionsV1: fallbackResult,
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
    const intschResult = {
      searches: [{ term: 'test-result', count: 1 }],
    }

    const ctx = createContext({
      intschSettings: {
        fetchAutocompleteSuggestionsV1: intschResult,
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

  it('should call intsch and return its result when successful', async () => {
    const intschResult = {
      searches: [{ term: 'popular', count: 10 }],
    }

    const ctx = createContext({
      intschSettings: {
        fetchTopSearchesV1: intschResult,
      },
    })

    const result = await fetchTopSearches(ctx)

    expect(ctx.clients.intsch.fetchTopSearchesV1).toHaveBeenCalledWith(
      undefined
    )

    expect(result).toEqual(intschResult)
  })

  it('should throw error when intsch fails', async () => {
    const ctx = createContext({
      intschSettings: {
        fetchTopSearchesV1: new Error('Service unavailable'),
      },
    })

    await expect(fetchTopSearches(ctx)).rejects.toThrow('Service unavailable')

    expect(ctx.clients.intsch.fetchTopSearchesV1).toHaveBeenCalledWith(
      undefined
    )
  })
})

describe('fetchSearchSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call intsch and return its result when successful', async () => {
    const intschResult = {
      searches: [{ term: 'suggestion', count: 5 }],
    }

    const ctx = createContext({
      intschSettings: {
        fetchSearchSuggestionsV1: intschResult,
      },
    })

    const result = await fetchSearchSuggestions(ctx, 'search')

    expect(ctx.clients.intsch.fetchSearchSuggestionsV1).toHaveBeenCalledWith({
      query: 'search',
      locale: undefined,
    })

    expect(result).toEqual(intschResult)
  })

  it('should throw error when intsch fails', async () => {
    const ctx = createContext({
      intschSettings: {
        fetchSearchSuggestionsV1: new Error('Service unavailable'),
      },
    })

    await expect(fetchSearchSuggestions(ctx, 'search')).rejects.toThrow(
      'Service unavailable'
    )

    expect(ctx.clients.intsch.fetchSearchSuggestionsV1).toHaveBeenCalledWith({
      query: 'search',
      locale: undefined,
    })
  })
})

describe('fetchCorrection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call intsch and return its result when successful', async () => {
    const intschResult = {
      correction: {
        text: 'text',
        highlighted: '<b>text</b>',
        misspelled: true,
        correction: true,
      },
    }

    const ctx = createContext({
      intschSettings: {
        fetchCorrectionV1: intschResult,
      },
    })

    const result = await fetchCorrection(ctx, 'test')

    expect(ctx.clients.intsch.fetchCorrectionV1).toHaveBeenCalledWith({
      query: 'test',
      locale: undefined,
    })

    expect(result).toEqual(intschResult)
  })

  it('should throw error when intsch fails', async () => {
    const ctx = createContext({
      intschSettings: {
        fetchCorrectionV1: new Error('Service unavailable'),
      },
    })

    await expect(fetchCorrection(ctx, 'test')).rejects.toThrow(
      'Service unavailable'
    )

    expect(ctx.clients.intsch.fetchCorrectionV1).toHaveBeenCalledWith({
      query: 'test',
      locale: undefined,
    })
  })
})
