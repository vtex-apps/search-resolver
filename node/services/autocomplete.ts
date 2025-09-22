export function fetchAutocompleteSuggestions(ctx: Context, query: string) {
  const { intelligentSearchApi } = ctx.clients

  return intelligentSearchApi.fetchAutocompleteSuggestions({
    query,
  })
}
