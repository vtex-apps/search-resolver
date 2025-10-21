import { fetchProductSearch } from './productSearch'
import { createContext } from '../mocks/contextFactory'
import type { ProductSearchInput } from '../typings/Search'
import * as compareResultsModule from '../utils/compareResults'

describe('fetchProductSearch service', () => {
  const mockProductSearchResponse = {
    products: [] as any,
    recordsFiltered: 2,
  }

  const mockArgs: ProductSearchInput = {
    fullText: 'test query',
    query: 'test',
    map: 'ft',
    selectedFacets: [],
    orderBy: 'OrderByTopSaleDESC',
    from: 0,
    to: 10,
    fuzzy: '0',
    operator: 'and',
    productOriginVtex: false,
    simulationBehavior: 'default',
    hideUnavailableItems: false,
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
        productSearch: mockProductSearchResponse,
      },
    })

    const result = await fetchProductSearch(ctx, mockArgs, mockSelectedFacets)

    expect(ctx.clients.intsch.productSearch).toHaveBeenCalled()
    expect(
      ctx.clients.intelligentSearchApi.productSearch
    ).not.toHaveBeenCalled()
    expect(result).toEqual({
      searchState: undefined,
      ...mockProductSearchResponse,
    })
  })

  it('should compare both APIs when shouldUseNewPLPEndpoint is undefined', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: undefined,
      },
      intelligentSearchApiSettings: {
        productSearch: mockProductSearchResponse,
      },
      intschSettings: {
        productSearch: mockProductSearchResponse,
      },
    })

    const mockResult = {
      searchState: undefined,
      ...mockProductSearchResponse,
    }

    const compareApiResultsSpy = jest
      .spyOn(compareResultsModule, 'compareApiResults')
      .mockResolvedValue(mockResult)

    const result = await fetchProductSearch(ctx, mockArgs, mockSelectedFacets)

    expect(compareApiResultsSpy).toHaveBeenCalled()
    expect(result).toEqual(mockResult)

    compareApiResultsSpy.mockRestore()
  })

  it('should handle shipping options correctly', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: false,
      },
      intelligentSearchApiSettings: {
        productSearch: mockProductSearchResponse,
      },
    })

    const shippingOptions = ['delivery', 'pickup']

    await fetchProductSearch(ctx, mockArgs, mockSelectedFacets, shippingOptions)

    expect(ctx.clients.intelligentSearchApi.productSearch).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'test query' }),
      expect.any(String),
      shippingOptions
    )
  })

  it('should preserve searchState in response', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: false,
      },
      intelligentSearchApiSettings: {
        productSearch: mockProductSearchResponse,
      },
    })

    const argsWithSearchState = {
      ...mockArgs,
      searchState: 'test-search-state',
    }

    const result = await fetchProductSearch(
      ctx,
      argsWithSearchState,
      mockSelectedFacets
    )

    expect(result.searchState).toBe('test-search-state')
  })

  it('should set translated flag in context when tenant is present and productOriginVtex is false', async () => {
    const mockResponseWithTranslated = {
      ...mockProductSearchResponse,
      translated: true,
    } as any

    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: false,
      },
      intelligentSearchApiSettings: {
        productSearch: mockResponseWithTranslated,
      },
      tenantLocale: 'en-US',
    })

    await fetchProductSearch(ctx, mockArgs, mockSelectedFacets)

    expect(ctx.translated).toBe(true)
  })

  it('should not set translated flag when productOriginVtex is true', async () => {
    const mockResponseWithTranslated = {
      ...mockProductSearchResponse,
      translated: true,
    } as any

    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: false,
      },
      intelligentSearchApiSettings: {
        productSearch: mockResponseWithTranslated,
      },
      tenantLocale: 'en-US',
    })

    const argsWithProductOriginVtex = {
      ...mockArgs,
      productOriginVtex: true,
    }

    await fetchProductSearch(ctx, argsWithProductOriginVtex, mockSelectedFacets)

    expect(ctx.translated).toBeUndefined()
  })

  it('should include advertisement options in the request', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: false,
      },
      intelligentSearchApiSettings: {
        productSearch: mockProductSearchResponse,
      },
    })

    const argsWithAdOptions = {
      ...mockArgs,
      advertisementOptions: {
        showSponsored: true,
        sponsoredCount: 5,
        repeatSponsoredProducts: false,
      },
    }

    await fetchProductSearch(ctx, argsWithAdOptions, mockSelectedFacets)

    expect(ctx.clients.intelligentSearchApi.productSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        showSponsored: true,
        sponsoredCount: 5,
        repeatSponsoredProducts: false,
      }),
      expect.any(String),
      undefined
    )
  })
})
