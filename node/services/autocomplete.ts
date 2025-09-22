import type { Context } from '@vtex/api'

import { compareApiResults } from '../utils/compareResults'
import type { Clients } from '../clients'

/**
 * Fetches autocomplete suggestions using the legacy intelligent-search-api
 */
export function fetchAutocompleteSuggestions(
  ctx: Context<Clients>,
  query: string
) {
  const { intelligentSearchApi, intsch } = ctx.clients

  return compareApiResults(
    () =>
      intelligentSearchApi.fetchAutocompleteSuggestions({
        query,
      }),
    () =>
      intsch.fetchAutocompleteSuggestions({
        query,
      }),
    ctx.vtex.production ? 1 : 100,
    ctx.vtex.logger,
    {
      logPrefix: `Autocomplete Suggestions: "${query}"`,
      args: { query },
    }
  )
}
