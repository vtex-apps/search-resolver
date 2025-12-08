import { buildAttributePath } from '../commons/compatibility-layer'

export async function fetchBanners(
  ctx: Context,
  args: { fullText: string; selectedFacets: SelectedFacet[] }
) {
  const { intsch } = ctx.clients

  const argumentsToFetchBanners = {
    query: args.fullText,
    path: buildAttributePath(args.selectedFacets),
  }

  const locale = (ctx.vtex.segment?.cultureInfo ||
    ctx.vtex.tenant?.locale ||
    ctx.vtex.locale) as string

  return intsch.fetchBannersV1({ ...argumentsToFetchBanners, locale })
}
