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
  }

  public fetchAutocompleteSuggestions = jest.fn()
}
