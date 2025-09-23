import { InstanceOptions, IOContext, JanusClient } from '@vtex/api'

import {
  AutocompleteSuggestionsArgs,
  AutocompleteSuggestionsResponse,
  IIntelligentSearchClient,
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
}
