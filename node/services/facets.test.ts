import { fetchFacets } from './facets'
import { createContext } from '../mocks/contextFactory'
import type { FacetsInput } from '../typings/Search'
import * as compareResultsModule from '../utils/compareResults'

describe('fetchFacets service', () => {
  const mockFacetsResponse = {
    facets: [
      {
        name: 'Category',
        values: [
          { name: 'Electronics', quantity: 10 },
          { name: 'Clothing', quantity: 5 },
        ],
      },
    ],
    translated: false,
  }

  const mockArgs: FacetsInput = {
    fullText: 'test query',
    query: 'test',
    map: 'ft',
    selectedFacets: [],
    removeHiddenFacets: false,
    hideUnavailableItems: false,
    categoryTreeBehavior: 'default',
  }

  const mockSelectedFacets: SelectedFacet[] = []

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should use intsch when shouldUseNewPLPEndpoint is true', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: true,
      },
      intschSettings: {
        facets: mockFacetsResponse,
      },
    })

    const result = await fetchFacets(ctx, mockArgs, mockSelectedFacets)

    expect(ctx.clients.intsch.facets).toHaveBeenCalled()
    expect(ctx.clients.intelligentSearchApi.facets).not.toHaveBeenCalled()
    expect(result).toEqual(mockFacetsResponse)
  })

  it('should compare both APIs when shouldUseNewPLPEndpoint is undefined', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: undefined,
      },
      intelligentSearchApiSettings: {
        facets: mockFacetsResponse,
      },
      intschSettings: {
        facets: mockFacetsResponse,
      },
    })

    const compareApiResultsSpy = jest
      .spyOn(compareResultsModule, 'compareApiResults')
      .mockResolvedValue(mockFacetsResponse)

    const result = await fetchFacets(ctx, mockArgs, mockSelectedFacets)

    expect(compareApiResultsSpy).toHaveBeenCalled()
    expect(result).toEqual(mockFacetsResponse)

    compareApiResultsSpy.mockRestore()
  })

  it('should handle shipping options correctly', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: false,
      },
      intelligentSearchApiSettings: {
        facets: mockFacetsResponse,
      },
    })

    const shippingOptions = ['delivery', 'pickup']

    await fetchFacets(ctx, mockArgs, mockSelectedFacets, shippingOptions)

    expect(ctx.clients.intelligentSearchApi.facets).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'test query' }),
      expect.any(String),
      shippingOptions
    )
  })

  it('should set translated flag in context when tenant is present', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: false,
      },
      intelligentSearchApiSettings: {
        facets: { ...mockFacetsResponse, translated: true },
      },
      tenantLocale: 'en-US',
    })

    await fetchFacets(ctx, mockArgs, mockSelectedFacets)

    expect(ctx.translated).toBe(true)
  })
})
