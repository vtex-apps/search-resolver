import type { VBase } from '@vtex/api'

import { VBASE_BUCKET, URL_COUNT_FILE_PATH } from './constants'
import type { SearchStatsUrlCount } from './searchStats'

export enum SORT {
  ASC = 'ASC',
  DESC = 'DESC',
}

export const searchURLsCount = async (
  vbase: VBase,
  limit: number,
  sort: SORT = SORT.DESC
) => {
  const data = (await vbase.getJSON<SearchStatsUrlCount>(
    VBASE_BUCKET,
    URL_COUNT_FILE_PATH,
    true
  )) as SearchStatsUrlCount

  let comparator = urlsCountDESCComparator

  if (sort === SORT.ASC) {
    comparator = urlsCountASCComparator
  }

  return (
    (data &&
      Object.entries(data.searchUrlCount)
        .sort(comparator)
        .slice(0, limit)
        .map(searchUrlStat => {
          return { path: searchUrlStat[0], count: searchUrlStat[1] }
        })) ||
    []
  )
}

const urlsCountASCComparator = (
  urlStatsA: [string, number],
  urlStatsB: [string, number]
) => {
  return urlStatsA[1] - urlStatsB[1]
}

const urlsCountDESCComparator = (
  urlStatsA: [string, number],
  urlStatsB: [string, number]
) => {
  return urlStatsB[1] - urlStatsA[1]
}
