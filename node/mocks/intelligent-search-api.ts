import type { IIntelligentSearchClient } from '../clients/intsch/types'
import type { IntelligentSearchClientArgs } from './intsch'

export class MockedIntelligentSearchApiClient
  implements IIntelligentSearchClient
{
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
  }

  public fetchAutocompleteSuggestions = jest.fn()
  public fetchTopSearches = jest.fn()
  public fetchSearchSuggestions = jest.fn()
}
