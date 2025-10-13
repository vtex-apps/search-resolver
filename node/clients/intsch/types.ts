/* eslint-disable @typescript-eslint/prefer-interface */

export type AutocompleteSuggestionsArgs = {
  query: string
}

export type AutocompleteSuggestionsResponse = {
  searches: {
    term: string
    count: number
    attributes?: {
      key: string
      value: string
      labelKey: string
      labelValue: string
    }[]
  }[]
}

export type TopSearchesResponse = {
  searches: {
    term: string
    count: number
  }[]
}

export type SearchSuggestionsArgs = {
  query: string
}

export type SearchSuggestionsResponse = {
  searches: {
    term: string
    count: number
  }[]
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
  banners: {
    id: string
    name: string
    area: string
    html: string
  }[]
}

export type FetchProductArgs = {
  field: 'id' | 'slug' | 'ean' | 'reference' | 'sku'
  value: string
  salesChannel?: string
  regionId?: string
  locale?:string
}

export type FetchProductResponse = SearchProduct
// eslint-disable-next-line @typescript-eslint/interface-name-prefix
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
}
