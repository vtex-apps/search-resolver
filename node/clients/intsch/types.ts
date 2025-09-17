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

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IIntelligentSearchClient {
  fetchAutocompleteSuggestions(
    args: AutocompleteSuggestionsArgs
  ): Promise<AutocompleteSuggestionsResponse>
}
