import type {
  IIntelligentSearchClient,
  AutocompleteSuggestionsResponse,
  TopSearchesResponse,
  SearchSuggestionsResponse,
  CorrectionResponse,
  FetchBannersResponse,
  FetchProductResponse,
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
  }

  public fetchAutocompleteSuggestions = jest.fn()
  public fetchTopSearches = jest.fn()
  public fetchSearchSuggestions = jest.fn()
  public fetchCorrection = jest.fn()
  public fetchBanners = jest.fn()
  public fetchProduct = jest.fn()
}

export type IntelligentSearchClientArgs = {
  fetchAutocompleteSuggestions?: AutocompleteSuggestionsResponse | Error
  fetchTopSearches?: TopSearchesResponse | Error
  fetchSearchSuggestions?: SearchSuggestionsResponse | Error
  fetchCorrection?: CorrectionResponse | Error
  fetchBanners?: FetchBannersResponse | Error
  fetchProduct?: FetchProductResponse | Error
}
