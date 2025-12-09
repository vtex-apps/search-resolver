export function fetchAutocompleteSuggestions(ctx: Context, query: string) {
  const { intsch } = ctx.clients

  const args = { query }

  const locale = (ctx.vtex.segment?.cultureInfo ??
    ctx.vtex.tenant?.locale ??
    ctx.vtex.locale) as string

  return intsch.fetchAutocompleteSuggestionsV1({ ...args, locale })
}

export function fetchTopSearches(ctx: Context) {
  const { intsch } = ctx.clients

  const locale = (ctx.vtex.segment?.cultureInfo ??
    ctx.vtex.tenant?.locale ??
    ctx.vtex.locale) as string

  return intsch.fetchTopSearchesV1(locale)
}

export function fetchSearchSuggestions(ctx: Context, query: string) {
  const { intsch } = ctx.clients

  const args = { query }

  const locale = (ctx.vtex.segment?.cultureInfo ??
    ctx.vtex.tenant?.locale ??
    ctx.vtex.locale) as string

  return intsch.fetchSearchSuggestionsV1({ ...args, locale })
}

export function fetchCorrection(ctx: Context, query: string) {
  const { intsch } = ctx.clients

  const args = { query }

  const locale = (ctx.vtex.segment?.cultureInfo ??
    ctx.vtex.tenant?.locale ??
    ctx.vtex.locale) as string

  return intsch.fetchCorrectionV1({ ...args, locale })
}
