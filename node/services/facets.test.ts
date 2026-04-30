import { fetchFacets } from './facets'
import { createContext } from '../mocks/contextFactory'
import type { FacetsInput } from '../typings/Search'

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

  it('should default hideUnavailableItems=true when DP is enabled and hideUnavailableItems is undefined', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      intschSettings: {
        facets: mockFacetsResponse,
      },
      segment: {
        facets: 'deliveryZonesHash=dzHash',
      } as any,
    })

    const { hideUnavailableItems: _ignored, ...argsWithoutHide } = mockArgs as any

    await fetchFacets(ctx, {
      args: argsWithoutHide,
      selectedFacets: mockSelectedFacets,
    })

    expect(ctx.clients.intsch.facets).toHaveBeenCalledWith(
      expect.objectContaining({ hideUnavailableItems: true }),
      expect.any(String),
      expect.any(Object)
    )
  })

  it('should fetch facets via intsch and not call intelligentSearchApi', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      intschSettings: {
        facets: mockFacetsResponse,
      },
    })

    const result = await fetchFacets(ctx, {
      args: mockArgs,
      selectedFacets: mockSelectedFacets,
    })

    expect(ctx.clients.intsch.facets).toHaveBeenCalled()
    expect(ctx.clients.intelligentSearchApi.facets).not.toHaveBeenCalled()
    expect(result).toEqual(mockFacetsResponse)
  })


  it('should handle shipping options correctly', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      intschSettings: {
        facets: mockFacetsResponse,
      },
    })

    const shippingOptions = ['delivery', 'pickup']

    await fetchFacets(ctx, {
      args: mockArgs,
      selectedFacets: mockSelectedFacets,
      shippingOptions,
    })

    expect(ctx.clients.intsch.facets).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'test query' }),
      expect.any(String),
      expect.objectContaining({ shippingHeader: shippingOptions })
    )
  })

  it('should set translated flag in context when tenant is present', async () => {
    const ctx = createContext({
      accountName: 'testaccount',
      intschSettings: {
        facets: { ...mockFacetsResponse, translated: true },
      },
      tenantLocale: 'en-US',
    })

    await fetchFacets(ctx, {
      args: mockArgs,
      selectedFacets: mockSelectedFacets,
    })

    expect(ctx.translated).toBe(true)
  })
})
