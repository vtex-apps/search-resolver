import type { Context } from '@vtex/api'

import { compareApiResults } from '../utils/compareResults'
import { Clients } from '../clients'

/**
 * Fetches autocomplete suggestions using the legacy intelligent-search-api
 */
export function fetchAutocompleteSuggestions(
  ctx: Context<Clients>,
  query: string
) {
  const { intelligentSearchApi } = ctx.clients

  return intelligentSearchApi.fetchAutocompleteSuggestions({
    query,
  })
}

/**
 * Fetches autocomplete suggestions using the new Intsch API
 */
export function fetchAutocompleteSuggestionsIntsch(
  ctx: Context<Clients>,
  query: string
) {
  const { intsch } = ctx.clients

  return intsch.fetchAutocompleteSuggestions({
    query,
  })
}

/**
 * Compares the results of both autocomplete suggestions implementations
 * @param ctx API Context
 * @param query Search query string
 * @param throwOnDifference Whether to throw an error if results differ
 */
export async function compareAutocompleteSuggestions(
  ctx: Context<Clients>,
  query: string,
  options = { throwOnDifference: false, logResults: true }
) {
  return compareApiResults(
    () => fetchAutocompleteSuggestions(ctx, query),
    () => fetchAutocompleteSuggestionsIntsch(ctx, query),
    {
      logPrefix: `Autocomplete Suggestions: "${query}"`,
      ...options,
    },
    ctx.vtex.logger
  )
}
