import type {
  IIntelligentSearchClient,
  AutocompleteSuggestionsResponse,
  TopSearchesResponse,
  SearchSuggestionsResponse,
  CorrectionResponse,
  FetchBannersResponse,
  FetchProductResponse,
  ProductSearchResponse,
  FacetsResponse,
} from '../clients/intsch/types'

export class MockedIntschClient implements IIntelligentSearchClient {
  constructor(args?: IntelligentSearchClientArgs) {
    if (args?.fetchAutocompleteSuggestions instanceof Error) {
      this.fetchAutocompleteSuggestions.mockRejectedValue(
        args.fetchAutocompleteSuggestions
      )
    } else {
      this.fetchAutocompleteSuggestions.mockResolvedValue(
        args?.fetchAutocompleteSuggestions ?? null
      )
    }

    if (args?.fetchTopSearches instanceof Error) {
      this.fetchTopSearches.mockRejectedValue(args.fetchTopSearches)
    } else {
      this.fetchTopSearches.mockResolvedValue(args?.fetchTopSearches ?? null)
    }

    if (args?.fetchSearchSuggestions instanceof Error) {
      this.fetchSearchSuggestions.mockRejectedValue(args.fetchSearchSuggestions)
    } else {
      this.fetchSearchSuggestions.mockResolvedValue(
        args?.fetchSearchSuggestions ?? null
      )
    }

    if (args?.fetchCorrection instanceof Error) {
      this.fetchCorrection.mockRejectedValue(args.fetchCorrection)
    } else {
      this.fetchCorrection.mockResolvedValue(args?.fetchCorrection ?? null)
    }

    if (args?.fetchBanners instanceof Error) {
      this.fetchBanners.mockRejectedValue(args.fetchBanners)
    } else {
      this.fetchBanners.mockResolvedValue(args?.fetchBanners ?? null)
    }

    if (args?.fetchProduct instanceof Error) {
      this.fetchProduct.mockRejectedValue(args.fetchProduct)
    } else {
      this.fetchProduct.mockResolvedValue(args?.fetchProduct ?? null)
    }

    if (args?.fetchAutocompleteSuggestionsV1 instanceof Error) {
      this.fetchAutocompleteSuggestionsV1.mockRejectedValue(
        args.fetchAutocompleteSuggestionsV1
      )
    } else {
      this.fetchAutocompleteSuggestionsV1.mockResolvedValue(
        args?.fetchAutocompleteSuggestionsV1 ?? null
      )
    }

    if (args?.fetchTopSearchesV1 instanceof Error) {
      this.fetchTopSearchesV1.mockRejectedValue(args.fetchTopSearchesV1)
    } else {
      this.fetchTopSearchesV1.mockResolvedValue(
        args?.fetchTopSearchesV1 ?? null
      )
    }

    if (args?.fetchSearchSuggestionsV1 instanceof Error) {
      this.fetchSearchSuggestionsV1.mockRejectedValue(
        args.fetchSearchSuggestionsV1
      )
    } else {
      this.fetchSearchSuggestionsV1.mockResolvedValue(
        args?.fetchSearchSuggestionsV1 ?? null
      )
    }

    if (args?.fetchCorrectionV1 instanceof Error) {
      this.fetchCorrectionV1.mockRejectedValue(args.fetchCorrectionV1)
    } else {
      this.fetchCorrectionV1.mockResolvedValue(args?.fetchCorrectionV1 ?? null)
    }

    if (args?.fetchBannersV1 instanceof Error) {
      this.fetchBannersV1.mockRejectedValue(args.fetchBannersV1)
    } else {
      this.fetchBannersV1.mockResolvedValue(args?.fetchBannersV1 ?? null)
    }

    if (args?.productSearch instanceof Error) {
      this.productSearch.mockRejectedValue(args.productSearch)
    } else {
      this.productSearch.mockResolvedValue(args?.productSearch ?? null)
    }

    if (args?.facets instanceof Error) {
      this.facets.mockRejectedValue(args.facets)
    } else {
      this.facets.mockResolvedValue(args?.facets ?? null)
    }
  }

  public fetchAutocompleteSuggestions = jest.fn()
  public fetchTopSearches = jest.fn()
  public fetchSearchSuggestions = jest.fn()
  public fetchCorrection = jest.fn()
  public fetchBanners = jest.fn()
  public fetchProduct = jest.fn()
  public fetchAutocompleteSuggestionsV1 = jest.fn()
  public fetchTopSearchesV1 = jest.fn()
  public fetchSearchSuggestionsV1 = jest.fn()
  public fetchCorrectionV1 = jest.fn()
  public fetchBannersV1 = jest.fn()
  public productSearch = jest.fn()
  public facets = jest.fn()
}

export type IntelligentSearchClientArgs = {
  fetchAutocompleteSuggestions?: AutocompleteSuggestionsResponse | Error
  fetchTopSearches?: TopSearchesResponse | Error
  fetchSearchSuggestions?: SearchSuggestionsResponse | Error
  fetchCorrection?: CorrectionResponse | Error
  fetchBanners?: FetchBannersResponse | Error
  fetchProduct?: FetchProductResponse | Error
  fetchAutocompleteSuggestionsV1?: AutocompleteSuggestionsResponse | Error
  fetchTopSearchesV1?: TopSearchesResponse | Error
  fetchSearchSuggestionsV1?: SearchSuggestionsResponse | Error
  fetchCorrectionV1?: CorrectionResponse | Error
  fetchBannersV1?: FetchBannersResponse | Error
  productSearch?: ProductSearchResponse | Error
  facets?: FacetsResponse | Error
}
