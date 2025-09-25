import { fetchAutocompleteSuggestions } from './autocomplete'
import { createContext } from '../mocks/contextFactory'

describe('fetchAutocompleteSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call both clients and not log errors', async () => {
    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchAutocompleteSuggestions: {
          searches: [{ term: 'test', count: 1 }],
        },
      },
      intschSettings: {
        fetchAutocompleteSuggestions: {
          searches: [{ term: 'test', count: 1 }],
        },
      },
    })

    await fetchAutocompleteSuggestions(ctx, 'test')

    expect(
      ctx.clients.intelligentSearchApi.fetchAutocompleteSuggestions
    ).toHaveBeenCalledWith({
      query: 'test',
    })
    expect(
      ctx.clients.intsch.fetchAutocompleteSuggestions
    ).toHaveBeenCalledWith({
      query: 'test',
    })

    // no errors should be logged because the results are equal
    expect(ctx.vtex.logger.error).not.toHaveBeenCalled()
  })

  it('should log if the results are different', async () => {
    const result = {
      searches: [{ term: 'test', count: 1 }],
    }

    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchAutocompleteSuggestions: result,
      },
      intschSettings: {
        fetchAutocompleteSuggestions: {
          searches: [
            {
              term: 'camisa feminina',
              count: 1,
              attributes: [
                {
                  key: 'departamento',
                  labelKey: 'Departamento',
                  labelValue: 'Apparel & Accessories',
                  value: 'apparel---accessories',
                },
                {
                  key: 'categoria',
                  labelKey: 'Categoria',
                  labelValue: 'Roupa',
                  value: 'roupa',
                },
              ],
            },
            {
              term: 'camisa masculina',
              count: 1,
            },
            {
              term: 'camiseta',
              count: 2,
            },
            {
              term: 'camisa',
              count: 1,
            },
          ],
        },
      },
    })

    const response = await fetchAutocompleteSuggestions(ctx, 'test')

    expect(
      ctx.clients.intelligentSearchApi.fetchAutocompleteSuggestions
    ).toHaveBeenCalledWith({
      query: 'test',
    })
    expect(
      ctx.clients.intsch.fetchAutocompleteSuggestions
    ).toHaveBeenCalledWith({
      query: 'test',
    })
    expect(ctx.vtex.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Autocomplete Suggestions: Results differ',
        params: JSON.stringify({ query: 'test' }),
        differenceCount: 6,
        differences: expect.arrayContaining([
          expect.objectContaining({
            path: 'searches',
            type: 'array_length_mismatch',
            expected: 1,
            actual: 4,
          }),
          expect.objectContaining({
            path: 'searches[0].term',
            type: 'different_value',
            expected: 'test',
            actual: 'camisa feminina',
          }),
        ]),
      })
    )
    expect(response).toEqual(result)
  })

  it('should still function if the new client fails', async () => {
    const result = {
      searches: [{ term: 'test', count: 1 }],
    }

    const ctx = createContext({
      intelligentSearchApiSettings: {
        fetchAutocompleteSuggestions: result,
      },
      intschSettings: {
        fetchAutocompleteSuggestions: new Error('Failed to fetch suggestions'),
      },
    })

    const response = await fetchAutocompleteSuggestions(ctx, 'test')

    expect(
      ctx.clients.intelligentSearchApi.fetchAutocompleteSuggestions
    ).toHaveBeenCalledWith({
      query: 'test',
    })
    expect(
      ctx.clients.intsch.fetchAutocompleteSuggestions
    ).toHaveBeenCalledWith({
      query: 'test',
    })

    expect(ctx.vtex.logger.error).not.toHaveBeenCalled()
    // the result should be the result from the old client
    expect(response).toEqual(result)
  })
})
