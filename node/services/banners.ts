import { compareApiResults } from '../utils/compareResults'
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

  const locale = (ctx.vtex.segment?.cultureInfo ||
    ctx.vtex.tenant?.locale ||
    ctx.vtex.locale) as string

  return compareApiResults(
    () => intelligentSearchApi.fetchBanners(argumentsToFetchBanners),
    () => intsch.fetchBannersV1({ ...argumentsToFetchBanners, locale }),
    ctx.vtex.production ? 10 : 100,
    ctx.vtex.logger,
    {
      logPrefix: 'Banners',
      args: argumentsToFetchBanners,
    }
  )
}
