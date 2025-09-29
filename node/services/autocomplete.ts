import type { Context } from '@vtex/api'

import type { Clients } from '../clients'

/**
 * Helper function to execute intsch as primary with intelligentSearchApi as fallback
 */
async function withFallback<T>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
  logger: any,
  operationName: string
): Promise<T> {
  try {
    return await primaryFn()
  } catch (error) {
    logger.warn({
      message: `${operationName}: Primary call failed, using fallback`,
      error: error.message,
    })
    return await fallbackFn()
  }
}

export function fetchAutocompleteSuggestions(
  ctx: Context<Clients>,
  query: string
) {
  const { intelligentSearchApi, intsch } = ctx.clients

  return withFallback(
    () => intsch.fetchAutocompleteSuggestions({ query }),
    () => intelligentSearchApi.fetchAutocompleteSuggestions({ query }),
    ctx.vtex.logger,
    'Autocomplete Suggestions'
  )
}

export function fetchTopSearches(ctx: Context<Clients>) {
  const { intelligentSearchApi, intsch } = ctx.clients

  return withFallback(
    () => intsch.fetchTopSearches(),
    () => intelligentSearchApi.fetchTopSearches(),
    ctx.vtex.logger,
    'Top Searches'
  )
}

export function fetchSearchSuggestions(ctx: Context<Clients>, query: string) {
  const { intelligentSearchApi, intsch } = ctx.clients

  return withFallback(
    () => intsch.fetchSearchSuggestions({ query }),
    () => intelligentSearchApi.fetchSearchSuggestions({ query }),
    ctx.vtex.logger,
    'Search Suggestions'
  )
}
export function fetchCorrection(ctx: Context<Clients>, query: string) {
  const { intelligentSearchApi, intsch } = ctx.clients

  return withFallback(
    () => intsch.fetchCorrection({ query }),
    () => intelligentSearchApi.fetchCorrection({ query }),
    ctx.vtex.logger,
    'Correction'
  )
}
