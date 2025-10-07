import { withFallback } from '../utils/with-fallback'
import { buildAttributePath } from '../commons/compatibility-layer'

export async function fetchBanners(
  ctx: Context,
  args: { fullText: string; selectedFacets: SelectedFacet[] }
) {
  const { intelligentSearchApi, intsch } = ctx.clients

  const argumentsToFetchBanners = {
    query: args.fullText,
    path: buildAttributePath(args.selectedFacets),
  }

  return withFallback(
    () => intsch.fetchBanners(argumentsToFetchBanners),
    () => intelligentSearchApi.fetchBanners(argumentsToFetchBanners),
    ctx.vtex.logger,
    'Banners',
    argumentsToFetchBanners
  )
}
