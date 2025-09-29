import { InstanceOptions, IOContext, JanusClient } from '@vtex/api'

import {
  AutocompleteSuggestionsArgs,
  AutocompleteSuggestionsResponse,
  CorrectionArgs,
  CorrectionResponse,
  IIntelligentSearchClient,
  SearchSuggestionsArgs,
  SearchSuggestionsResponse,
  TopSearchesResponse,
} from './types'

export class Intsch extends JanusClient implements IIntelligentSearchClient {
  private locale: string | undefined

  public constructor(ctx: IOContext, options?: InstanceOptions) {
    const env = ctx.production ? 'stable' : 'beta'

    super(ctx, options, env)

    const { locale, tenant } = ctx

    this.locale = locale ?? tenant?.locale
  }

  public fetchAutocompleteSuggestions(
    args: AutocompleteSuggestionsArgs
  ): Promise<AutocompleteSuggestionsResponse> {
    return this.http.get(
      '/api/intelligent-search/v0/autocomplete-suggestions',
      {
        params: { query: args.query, locale: this.locale },
        metric: 'autocompleteSearchSuggestions-new',
      }
    )
  }

  public fetchTopSearches(): Promise<TopSearchesResponse> {
    return this.http.get('/api/intelligent-search/v0/top-searches', {
      params: { locale: this.locale },
      metric: 'topSearches-new',
    })
  }

  public fetchSearchSuggestions(
    args: SearchSuggestionsArgs
  ): Promise<SearchSuggestionsResponse> {
    return this.http.get('/api/intelligent-search/v0/search-suggestions', {
      params: { query: args.query, locale: this.locale },
      metric: 'searchSuggestions-new',
    })
  }

  public fetchCorrection(args: CorrectionArgs): Promise<CorrectionResponse> {
    return this.http.get('/api/intelligent-search/v0/correction-search', {
      params: { query: args.query, locale: this.locale },
      metric: 'correction-new',
    })
  }
}
