export type AutocompleteSuggestionsArgs = {
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

export type SearchSuggestionsResponse = {
  searches: Array<{
    term: string
    count: number
  }>
}

export type CorrectionArgs = {
  query: string
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
    args: AutocompleteSuggestionsArgs
  ): Promise<AutocompleteSuggestionsResponse>
  fetchTopSearchesV1(): Promise<TopSearchesResponse>
  fetchSearchSuggestionsV1(
    args: SearchSuggestionsArgs
  ): Promise<SearchSuggestionsResponse>
  fetchCorrectionV1(args: CorrectionArgs): Promise<CorrectionResponse>
  fetchBannersV1(args: FetchBannersArgs): Promise<FetchBannersResponse>
}
