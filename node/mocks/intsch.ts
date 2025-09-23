import type {
  IIntelligentSearchClient,
  AutocompleteSuggestionsResponse,
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
  }

  public fetchAutocompleteSuggestions = jest.fn()
}

export type IntelligentSearchClientArgs = {
  fetchAutocompleteSuggestions?: AutocompleteSuggestionsResponse | Error
}
