import { fetchProductSearch } from './productSearch'
import { createContext } from '../mocks/contextFactory'
import type { ProductSearchInput } from '../typings/Search'

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

  it('should default hideUnavailableItems=true when DP is enabled and hideUnavailableItems is undefined (intsch path)', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: true,
      },
      intschSettings: {
        productSearch: mockProductSearchResponse,
      },
      segment: {
        facets: 'deliveryZonesHash=dzHash',
      } as any,
    })

    const { hideUnavailableItems: _ignored, ...argsWithoutHide } =
      mockArgs as any

    await fetchProductSearch(ctx, argsWithoutHide, mockSelectedFacets)

    expect(ctx.clients.intsch.productSearch).toHaveBeenCalledWith(
      expect.objectContaining({ hideUnavailableItems: true }),
      expect.any(String),
      expect.any(Object)
    )
  })

  it('should default hideUnavailableItems=true when DP is enabled and hideUnavailableItems is undefined (biggy path)', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: false,
      },
      intelligentSearchApiSettings: {
        productSearch: mockProductSearchResponse,
      },
      intschSettings: {
        productSearch: mockProductSearchResponse,
      },
      segment: {
        facets: 'deliveryZonesHash=dzHash',
      } as any,
    })

    const { hideUnavailableItems: _ignored, ...argsWithoutHide } =
      mockArgs as any

    await fetchProductSearch(ctx, argsWithoutHide, mockSelectedFacets)

    expect(ctx.clients.intelligentSearchApi.productSearch).toHaveBeenCalledWith(
      expect.objectContaining({ hideUnavailableItems: true }),
      expect.any(String),
      expect.objectContaining({ shippingHeader: undefined })
    )
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

  it('should call only the legacy client, never intsch, when shouldUseNewPLPEndpoint is false', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: false,
      },
      intelligentSearchApiSettings: {
        productSearch: mockProductSearchResponse,
      },
      intschSettings: {
        productSearch: mockProductSearchResponse,
      },
    })

    const result = await fetchProductSearch(ctx, mockArgs, mockSelectedFacets)

    expect(
      ctx.clients.intelligentSearchApi.productSearch
    ).toHaveBeenCalledTimes(1)
    expect(ctx.clients.intsch.productSearch).not.toHaveBeenCalled()
    expect(result).toEqual({
      searchState: undefined,
      ...mockProductSearchResponse,
    })
  })

  it('should log a warning when a PLP request is served without intsch', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: false,
      },
      intelligentSearchApiSettings: {
        productSearch: mockProductSearchResponse,
      },
    })

    await fetchProductSearch(ctx, mockArgs, mockSelectedFacets)

    expect(ctx.vtex.logger.warn).toHaveBeenCalledWith({
      message: 'ProductSearch migration: intsch not used as final response',
      account: 'testaccount',
    })
  })

  it('should not log the "intsch not used" warning when shouldUseNewPLPEndpoint is true', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: true,
      },
      intschSettings: {
        productSearch: mockProductSearchResponse,
      },
    })

    await fetchProductSearch(ctx, mockArgs, mockSelectedFacets)

    expect(ctx.vtex.logger.warn).not.toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'ProductSearch migration: intsch not used as final response',
      })
    )
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
      { shippingHeader: shippingOptions }
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
      { shippingHeader: undefined }
    )
  })

  it('sends semanticRatio to intsch when enableHybridSearch setting is true', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: true,
        enableHybridSearch: true,
      },
      intschSettings: {
        productSearch: mockProductSearchResponse,
      },
    })

    await fetchProductSearch(ctx, mockArgs, mockSelectedFacets)

    expect(ctx.clients.intsch.productSearch).toHaveBeenCalledWith(
      expect.objectContaining({ semanticRatio: 0.5 }),
      expect.any(String),
      expect.any(Object)
    )
  })

  it('does not send semanticRatio to intsch when enableHybridSearch setting is false', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: true,
        enableHybridSearch: false,
      },
      intschSettings: {
        productSearch: mockProductSearchResponse,
      },
    })

    await fetchProductSearch(ctx, mockArgs, mockSelectedFacets)

    const [callArgs] = (ctx.clients.intsch.productSearch as jest.Mock).mock
      .calls[0]

    expect(callArgs).not.toHaveProperty('semanticRatio')
  })

  it('never sends semanticRatio to the legacy Biggy client even when enableHybridSearch is true', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: false,
        enableHybridSearch: true,
      },
      intelligentSearchApiSettings: {
        productSearch: mockProductSearchResponse,
      },
      intschSettings: {
        productSearch: mockProductSearchResponse,
      },
    })

    await fetchProductSearch(ctx, mockArgs, mockSelectedFacets)

    const [callArgs] = (
      ctx.clients.intelligentSearchApi.productSearch as jest.Mock
    ).mock.calls[0]

    expect(callArgs).not.toHaveProperty('semanticRatio')
  })

  it('sends dpPreview=true to intsch when enableDeliveryPromisePreview is on', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: true,
        enableDeliveryPromisePreview: true,
      },
      intschSettings: {
        productSearch: mockProductSearchResponse,
      },
    })

    await fetchProductSearch(ctx, mockArgs, mockSelectedFacets)

    expect(ctx.clients.intsch.productSearch).toHaveBeenCalledWith(
      expect.objectContaining({ dpPreview: true }),
      expect.any(String),
      expect.any(Object)
    )
  })

  it('does not send dpPreview when enableDeliveryPromisePreview is off', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      appSettings: {
        shouldUseNewPLPEndpoint: true,
      },
      intschSettings: {
        productSearch: mockProductSearchResponse,
      },
    })

    await fetchProductSearch(ctx, mockArgs, mockSelectedFacets)

    const [callArgs] = (ctx.clients.intsch.productSearch as jest.Mock).mock
      .calls[0]

    expect(callArgs.dpPreview).toBe(false)
  })
})
