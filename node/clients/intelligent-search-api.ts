import type { InstanceOptions, IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

import { parseState } from '../utils/searchState'
import type {
  FetchBannersArgs,
  IIntelligentSearchClient,
  FetchProductArgs,
  FetchProductResponse,
  AutocompleteSuggestionsResponse,
  CorrectionResponse,
  FetchBannersResponse,
  SearchSuggestionsResponse,
  TopSearchesResponse,
} from './intsch/types'
import type { Options, SearchResultArgs } from '../typings/Search'

export const isPathTraversal = (str: string) => str.indexOf('..') >= 0

interface CorrectionParams {
  query: string
}

interface SearchSuggestionsParams {
  query: string
}

interface AutocompleteSearchSuggestionsParams {
  query: string
}

export type FacetsArgs = {
  query?: string
  page?: number
  count?: number
  sort?: string
  operator?: string
  fuzzy?: string
  leap?: boolean
  tradePolicy?: number
  searchState?: string
  hideUnavailableItems?: boolean | null
  removeHiddenFacets?: boolean | null
  options?: Options
  initialAttributes?: string
  workspaceSearchParams?: object
  regionId?: string | null
}

export const decodeQuery = (query: string) => {
  try {
    return decodeURIComponent(query)
  } catch (e) {
    return query
  }
}

export class IntelligentSearchApi
  extends ExternalClient
  implements IIntelligentSearchClient
{
  private locale: string | undefined

  constructor(context: IOContext, options?: InstanceOptions) {
    super(
      `http://${context.workspace}--${context.account}.myvtex.com/_v/api/intelligent-search`,
      context,
      {
        ...options,
        headers: {
          ...options?.headers,
        },
      }
    )

    const { locale, tenant } = context

    this.locale = locale ?? tenant?.locale
  }

  public async fetchTopSearches() {
    return this.http.get('/top_searches', {
      params: {
        locale: this.locale,
      },
      metric: 'topSearches',
    })
  }

  public async fetchCorrection(params: CorrectionParams) {
    return this.http.get('/correction_search', {
      params: { ...params, locale: this.locale },
      metric: 'correction',
    })
  }

  public async fetchSearchSuggestions(params: SearchSuggestionsParams) {
    return this.http.get('/search_suggestions', {
      params: { ...params, locale: this.locale },
      metric: 'searchSuggestions',
    })
  }

  public async fetchAutocompleteSuggestions(
    params: AutocompleteSearchSuggestionsParams
  ) {
    return this.http.get('/autocomplete_suggestions', {
      params: { ...params, locale: this.locale },
      metric: 'autocompleteSearchSuggestions',
    })
  }

  public async fetchBanners(params: FetchBannersArgs) {
    if (isPathTraversal(params.path)) {
      throw new Error('Malformed URL')
    }

    return this.http.get(`/banners/${params.path}`, {
      params: { query: params.query, locale: this.locale },
      metric: 'banners',
    })
  }

  public async facets(
    params: FacetsArgs,
    path: string,
    shippingHeader?: string[]
  ) {
    if (isPathTraversal(path)) {
      throw new Error('Malformed URL')
    }

    const { query, leap, searchState } = params

    return this.http.get(`/facets/${path}`, {
      params: {
        ...params,
        query: query && decodeQuery(query),
        locale: this.locale,
        bgy_leap: leap ? true : undefined,
        ...parseState(searchState),
      },
      metric: 'facets',
      headers: {
        'x-vtex-shipping-options': shippingHeader ?? '',
      },
    })
  }

  public async productSearch(
    params: SearchResultArgs,
    path: string,
    shippingHeader?: string[]
  ) {
    const { query, leap, searchState } = params

    if (isPathTraversal(path)) {
      throw new Error('Malformed URL')
    }

    return this.http.get(`/product_search/${path}`, {
      params: {
        query: query && decodeQuery(query),
        locale: this.locale,
        bgy_leap: leap ? true : undefined,
        ...parseState(searchState),
        ...params,
      },
      metric: 'product-search',
      headers: {
        'x-vtex-shipping-options': shippingHeader ?? '',
      },
    })
  }

  public async sponsoredProducts(
    params: SearchResultArgs,
    path: string,
    shippingHeader?: string[]
  ) {
    const { query, leap, searchState } = params

    if (isPathTraversal(path)) {
      throw new Error('Malformed URL')
    }

    return this.http.get(`/sponsored_products/${path}`, {
      params: {
        query: query && decodeQuery(query),
        locale: this.locale,
        bgy_leap: leap ? true : undefined,
        ...parseState(searchState),
        ...params,
      },
      metric: 'product-search',
      headers: {
        'x-vtex-shipping-options': shippingHeader ?? '',
      },
    })
  }

  public async fetchAutocompleteSuggestionsV1(): Promise<AutocompleteSuggestionsResponse> {
    throw new Error('Method not implemented.')
  }

  public async fetchTopSearchesV1(): Promise<TopSearchesResponse> {
    throw new Error('Method not implemented.')
  }

  public async fetchSearchSuggestionsV1(): Promise<SearchSuggestionsResponse> {
    throw new Error('Method not implemented.')
  }

  public async fetchCorrectionV1(): Promise<CorrectionResponse> {
    throw new Error('Method not implemented.')
  }

  public async fetchBannersV1(): Promise<FetchBannersResponse> {
    throw new Error('Method not implemented.')
  }

  public async fetchProduct(
    _: FetchProductArgs
  ): Promise<FetchProductResponse> {
    throw new Error('Method not implemented.')
  }
}
