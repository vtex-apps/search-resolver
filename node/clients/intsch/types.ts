import type { SearchResultArgs } from '../../typings/Search'
import type { FacetsArgs } from '../intelligent-search-api'

export type AutocompleteSuggestionsArgs = {
  query: string
}

export type AutocompleteSuggestionsArgsV1 = {
  locale: string
  query: string
}

export type AutocompleteSuggestionsResponse = {
  searches: Array<{
    term: string
    count: number
    attributes?: Array<{
      key: string
      value: string
      labelKey: string
      labelValue: string
    }>
  }>
}

export type TopSearchesResponse = {
  searches: Array<{
    term: string
    count: number
  }>
}

export type SearchSuggestionsArgs = {
  query: string
}

export type SearchSuggestionsArgsV1 = {
  query: string
  locale: string
}

export type SearchSuggestionsResponse = {
  searches: Array<{
    term: string
    count: number
  }>
}

export type CorrectionArgs = {
  query: string
}

export type CorrectionArgsV1 = {
  query: string
  locale: string
}

export type CorrectionResponse = {
  correction: {
    text: string
    highlighted: string
    misspelled: boolean
    correction: boolean
  }
}

export type FetchBannersArgs = {
  query: string
  path: string
}

export type FetchBannersArgsV1 = {
  locale: string
  query: string
  path: string
}

export type FetchBannersResponse = {
  banners: Array<{
    id: string
    name: string
    area: string
    html: string
  }>
}

export type FetchProductArgs = {
  field: 'id' | 'slug' | 'ean' | 'reference' | 'sku'
  value: string
  salesChannel?: string
  regionId?: string
  locale?: string
}

export type FetchProductResponse = SearchProduct

export type ProductSearchResponse = {
  products: SearchProduct[]
}

export type FacetsResponse = any

export interface IIntelligentSearchClient {
  fetchAutocompleteSuggestions(
    args: AutocompleteSuggestionsArgs
  ): Promise<AutocompleteSuggestionsResponse>
  fetchTopSearches(): Promise<TopSearchesResponse>
  fetchSearchSuggestions(
    args: SearchSuggestionsArgs
  ): Promise<SearchSuggestionsResponse>
  fetchCorrection(args: CorrectionArgs): Promise<CorrectionResponse>
  fetchBanners(args: FetchBannersArgs): Promise<FetchBannersResponse>
  fetchProduct(args: FetchProductArgs): Promise<FetchProductResponse>
  fetchAutocompleteSuggestionsV1(
    args: AutocompleteSuggestionsArgsV1
  ): Promise<AutocompleteSuggestionsResponse>
  fetchTopSearchesV1(locale: string): Promise<TopSearchesResponse>
  fetchSearchSuggestionsV1(
    args: SearchSuggestionsArgsV1
  ): Promise<SearchSuggestionsResponse>
  fetchCorrectionV1(args: CorrectionArgsV1): Promise<CorrectionResponse>
  fetchBannersV1(args: FetchBannersArgsV1): Promise<FetchBannersResponse>
  productSearch(
    args: SearchResultArgs,
    path: string,
    shippingHeader?: string[]
  ): Promise<ProductSearchResponse>
  facets(
    params: FacetsArgs,
    path: string,
    shippingHeader?: string[]
  ): Promise<FacetsResponse>
}
