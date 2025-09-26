import { 
  fetchAutocompleteSuggestions, 
  fetchTopSearches, 
  fetchSearchSuggestions 
} from './autocomplete'
import { createContext } from '../mocks/contextFactory'

describe('fetchAutocompleteSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call intsch as primary and return its result when successful', async () => {
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

  it('should use fallback when intsch fails', async () => {
    const fallbackResult = {
      searches: [{ term: 'fallback-result', count: 1 }],
    }

    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchAutocompleteSuggestions: fallbackResult,
      },
      intschSettings: {
        fetchAutocompleteSuggestions: new Error('Intsch service unavailable'),
      },
    })

    const response = await fetchAutocompleteSuggestions(ctx, 'test')

    expect(
      ctx.clients.intsch.fetchAutocompleteSuggestions
    ).toHaveBeenCalledWith({
      query: 'test',
    })
    expect(
      ctx.clients.intelligentSearchApi.fetchAutocompleteSuggestions
    ).toHaveBeenCalledWith({
      query: 'test',
    })

    expect(ctx.vtex.logger.warn).toHaveBeenCalledWith({
      message: 'Autocomplete Suggestions: Primary call failed, using fallback',
      error: 'Intsch service unavailable',
    })
    expect(response).toEqual(fallbackResult)
  })

  it('should throw error when both intsch and fallback fail', async () => {
    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchAutocompleteSuggestions: new Error('Fallback service also unavailable'),
      },
      intschSettings: {
        fetchAutocompleteSuggestions: new Error('Primary service unavailable'),
      },
    })

    await expect(fetchAutocompleteSuggestions(ctx, 'test')).rejects.toThrow(
      'Fallback service also unavailable'
    )

    expect(
      ctx.clients.intsch.fetchAutocompleteSuggestions
    ).toHaveBeenCalledWith({
      query: 'test',
    })
    expect(
      ctx.clients.intelligentSearchApi.fetchAutocompleteSuggestions
    ).toHaveBeenCalledWith({
      query: 'test',
    })

    expect(ctx.vtex.logger.warn).toHaveBeenCalledWith({
      message: 'Autocomplete Suggestions: Primary call failed, using fallback',
      error: 'Primary service unavailable',
    })
  })
})

describe('fetchTopSearches', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call intsch as primary and return its result when successful', async () => {
    const intschResult = {
      searches: [{ term: 'popular', count: 10 }],
    }

    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchTopSearches: {
          searches: [{ term: 'fallback', count: 5 }],
        },
      },
      intschSettings: {
        fetchTopSearches: intschResult,
      },
    })

    const result = await fetchTopSearches(ctx)

    expect(ctx.clients.intsch.fetchTopSearches).toHaveBeenCalledWith()
    expect(ctx.clients.intelligentSearchApi.fetchTopSearches).not.toHaveBeenCalled()

    expect(result).toEqual(intschResult)
    expect(ctx.vtex.logger.warn).not.toHaveBeenCalled()
  })

  it('should use fallback when intsch fails', async () => {
    const fallbackResult = {
      searches: [{ term: 'fallback-top', count: 3 }],
    }

    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchTopSearches: fallbackResult,
      },
      intschSettings: {
        fetchTopSearches: new Error('Intsch top searches unavailable'),
      },
    })

    const response = await fetchTopSearches(ctx)

    expect(ctx.clients.intsch.fetchTopSearches).toHaveBeenCalledWith()
    expect(ctx.clients.intelligentSearchApi.fetchTopSearches).toHaveBeenCalledWith()

    expect(ctx.vtex.logger.warn).toHaveBeenCalledWith({
      message: 'Top Searches: Primary call failed, using fallback',
      error: 'Intsch top searches unavailable',
    })
    expect(response).toEqual(fallbackResult)
  })
})

describe('fetchSearchSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call intsch as primary and return its result when successful', async () => {
    const intschResult = {
      searches: [{ term: 'suggestion', count: 5 }],
    }

    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchSearchSuggestions: {
          searches: [{ term: 'fallback-suggestion', count: 2 }],
        },
      },
      intschSettings: {
        fetchSearchSuggestions: intschResult,
      },
    })

    const result = await fetchSearchSuggestions(ctx, 'search')

    expect(ctx.clients.intsch.fetchSearchSuggestions).toHaveBeenCalledWith({
      query: 'search',
    })
    expect(ctx.clients.intelligentSearchApi.fetchSearchSuggestions).not.toHaveBeenCalled()

    expect(result).toEqual(intschResult)
    expect(ctx.vtex.logger.warn).not.toHaveBeenCalled()
  })

  it('should use fallback when intsch fails', async () => {
    const fallbackResult = {
      searches: [{ term: 'fallback-suggestion', count: 2 }],
    }

    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchSearchSuggestions: fallbackResult,
      },
      intschSettings: {
        fetchSearchSuggestions: new Error('Intsch search suggestions unavailable'),
      },
    })

    const response = await fetchSearchSuggestions(ctx, 'search')

    expect(ctx.clients.intsch.fetchSearchSuggestions).toHaveBeenCalledWith({
      query: 'search',
    })
    expect(ctx.clients.intelligentSearchApi.fetchSearchSuggestions).toHaveBeenCalledWith({
      query: 'search',
    })

    expect(ctx.vtex.logger.warn).toHaveBeenCalledWith({
      message: 'Search Suggestions: Primary call failed, using fallback',
      error: 'Intsch search suggestions unavailable',
    })
    expect(response).toEqual(fallbackResult)
  })
})
