import type { Context } from '@vtex/api'

import { compareApiResults } from '../utils/compareResults'
import type { Clients } from '../clients'

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
    ctx.vtex.production ? 10 : 100,
    ctx.vtex.logger,
    {
      logPrefix: 'Autocomplete Suggestions',
      args: { query },
    }
  )
}

export function fetchTopSearches(ctx: Context<Clients>) {
  const { intelligentSearchApi, intsch } = ctx.clients

  return compareApiResults(
    () => intelligentSearchApi.fetchTopSearches(),
    () => intsch.fetchTopSearches(),
    ctx.vtex.production ? 10 : 100,
    ctx.vtex.logger,
    {
      logPrefix: 'Top Searches',
      args: {},
    }
  )
}

export function fetchSearchSuggestions(ctx: Context<Clients>, query: string) {
  const { intelligentSearchApi, intsch } = ctx.clients

  return compareApiResults(
    () =>
      intelligentSearchApi.fetchSearchSuggestions({
        query,
      }),
    () =>
      intsch.fetchSearchSuggestions({
        query,
      }),
    ctx.vtex.production ? 10 : 100,
    ctx.vtex.logger,
    {
      logPrefix: 'Search Suggestions',
      args: { query },
    }
  )
}
