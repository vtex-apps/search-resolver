import {
  PATH_SEPARATOR,
  MAP_QUERY_PARAM,
  MAP_SEPARATOR,
  VBASE_BUCKET,
  URL_COUNT_FILE_PATH,
  INDEXING_UPDATE_FREQUENCY,
  INDEXING_EVENT_ROUTE_NAME,
} from './constants'

export interface SearchStatsUrlCount {
  updatedCount: number
  searchUrlCount: Record<string, number>
}

export const count = async (ctx: Context, args: SearchArgs) => {
  const {
    clients: { vbase },
  } = ctx

  const searchURLPath = `${PATH_SEPARATOR}${args.query}?${MAP_QUERY_PARAM}=${args.map}`
  const pathSegments = args.query && args.query.split(PATH_SEPARATOR)
  const mapSegments = args.map && args.map.split(MAP_SEPARATOR)

  if (pathSegments && mapSegments && pathSegments.length === mapSegments.length) {
    const data = ((await vbase.getJSON<SearchStatsUrlCount>(
      VBASE_BUCKET,
      URL_COUNT_FILE_PATH,
      true
    )) || { updatedCount: 0, searchUrlCount: {} }) as SearchStatsUrlCount

    data.searchUrlCount[searchURLPath] = (data.searchUrlCount[searchURLPath] || 0) + 1
    data.updatedCount += 1
    if (data.updatedCount === INDEXING_UPDATE_FREQUENCY) {
      data.updatedCount = 0
      sendIndexSearchUrlsEvent(ctx)
    }

    vbase.saveJSON<SearchStatsUrlCount>(VBASE_BUCKET, URL_COUNT_FILE_PATH, data)
  }
}

const sendIndexSearchUrlsEvent = async (ctx: Context) => {
  const { clients: { events }, vtex: { locale, tenant, binding } } = ctx

  events.sendEvent('', INDEXING_EVENT_ROUTE_NAME, {locale, tenant, binding})
}