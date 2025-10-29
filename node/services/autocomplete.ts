import { compareApiResults, NO_TRAFFIC } from '../utils/compareResults'

export function fetchAutocompleteSuggestions(ctx: Context, query: string) {
  const { intelligentSearchApi, intsch } = ctx.clients

  const args = { query }

  const locale = (ctx.vtex.segment?.cultureInfo ||
    ctx.vtex.tenant?.locale ||
    ctx.vtex.locale) as string

  return compareApiResults(
    () => intelligentSearchApi.fetchAutocompleteSuggestions(args),
    () => intsch.fetchAutocompleteSuggestionsV1({ ...args, locale }),
    ctx.vtex.production ? NO_TRAFFIC : 100,
    ctx.vtex.logger,
    {
      logPrefix: 'Autocomplete Suggestions',
      args: { ...args, locale },
    }
  )
}

export function fetchTopSearches(ctx: Context) {
  const { intelligentSearchApi, intsch } = ctx.clients

  const locale = (ctx.vtex.segment?.cultureInfo ||
    ctx.vtex.tenant?.locale ||
    ctx.vtex.locale) as string

  return compareApiResults(
    () => intelligentSearchApi.fetchTopSearches(),
    () => intsch.fetchTopSearchesV1(locale),
    ctx.vtex.production ? NO_TRAFFIC : 100,
    ctx.vtex.logger,
    {
      logPrefix: 'Top Searches',
      args: {
        locale,
      },
    }
  )
}

export function fetchSearchSuggestions(ctx: Context, query: string) {
  const { intelligentSearchApi, intsch } = ctx.clients

  const args = { query }

  const locale = (ctx.vtex.segment?.cultureInfo ||
    ctx.vtex.tenant?.locale ||
    ctx.vtex.locale) as string

  return compareApiResults(
    () => intelligentSearchApi.fetchSearchSuggestions(args),
    () => intsch.fetchSearchSuggestionsV1({ ...args, locale }),
    ctx.vtex.production ? NO_TRAFFIC : 100,
    ctx.vtex.logger,
    {
      logPrefix: 'Search Suggestions',
      args: { ...args, locale },
    }
  )
}

export function fetchCorrection(ctx: Context, query: string) {
  const { intelligentSearchApi, intsch } = ctx.clients

  const args = { query }

  const locale = (ctx.vtex.segment?.cultureInfo ||
    ctx.vtex.tenant?.locale ||
    ctx.vtex.locale) as string

  return compareApiResults(
    () => intelligentSearchApi.fetchCorrection(args),
    () => intsch.fetchCorrectionV1({ ...args, locale }),
    ctx.vtex.production ? NO_TRAFFIC : 100,
    ctx.vtex.logger,
    {
      logPrefix: 'Correction',
      args: { ...args, locale },
    }
  )
}
