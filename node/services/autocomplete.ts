
import { withFallback } from '../utils/with-fallback'

export function fetchAutocompleteSuggestions(
  ctx: Context,
  query: string
) {
  const { intelligentSearchApi, intsch } = ctx.clients

  return withFallback(
    () => intsch.fetchAutocompleteSuggestions({ query }),
    () => intelligentSearchApi.fetchAutocompleteSuggestions({ query }),
    ctx.vtex.logger,
    'Autocomplete Suggestions',
    { query }
  )
}

export function fetchTopSearches(ctx: Context) {
  const { intelligentSearchApi, intsch } = ctx.clients

  return withFallback(
    () => intsch.fetchTopSearches(),
    () => intelligentSearchApi.fetchTopSearches(),
    ctx.vtex.logger,
    'Top Searches',
    {}
  )
}

export function fetchSearchSuggestions(ctx: Context, query: string) {
  const { intelligentSearchApi, intsch } = ctx.clients

  return withFallback(
    () => intsch.fetchSearchSuggestions({ query }),
    () => intelligentSearchApi.fetchSearchSuggestions({ query }),
    ctx.vtex.logger,
    'Search Suggestions',
    { query }
  )
}

export function fetchCorrection(ctx: Context, query: string) {
  const { intelligentSearchApi, intsch } = ctx.clients

  return withFallback(
    () => intsch.fetchCorrection({ query }),
    () => intelligentSearchApi.fetchCorrection({ query }),
    ctx.vtex.logger,
    'Correction',
    { query }
  )
}
