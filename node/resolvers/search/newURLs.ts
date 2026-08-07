import type { Search } from '../../clients/search'
import { CATEGORY_SEGMENT, FULL_TEXT_SEGMENT } from './constants'
import type { CategoryIdNamePair } from '../../utils/CategoryTreeSegmentsFinder'
import { CategoryTreeSegmentsFinder } from '../../utils/CategoryTreeSegmentsFinder'
import { getOrSet } from '../../utils/cache'
import { searchUrlsCache, facetsCache } from './modules/compatibilityCache'
import { searchSlugify } from '../../utils/slug'
import { PATH_SEPARATOR, MAP_SEPARATOR } from '../stats/constants'

export const hasFacetsBadArgs = ({ query, map }: QueryArgs) => !query || !map

const normalizeName = (name: string): string => searchSlugify(name)

const fillCategoriesMapSegments = (
  categories: Array<CategoryIdNamePair | null>,
  map: string
): Array<string | undefined> => {
  const mapSegments = map
    .split(MAP_SEPARATOR)
    .filter((segment) => segment !== CATEGORY_SEGMENT)

  const segmentsFound = []

  for (const category of categories) {
    if (!category) {
      segmentsFound.push(mapSegments.shift())
    } else {
      segmentsFound.push(CATEGORY_SEGMENT)
    }
  }

  return [...segmentsFound, ...mapSegments]
}

const getFacetsQueryFromCategories = (
  categories: Array<CategoryIdNamePair | null>
) => {
  const queryArgs = categories.reduce(
    (acc: QueryArgs, category) => {
      if (category) {
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        acc.query = acc.query
          ? acc.query + PATH_SEPARATOR + category.name.toLocaleLowerCase()
          : category.name.toLocaleLowerCase()
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        acc.map = acc.map
          ? acc.map + MAP_SEPARATOR + CATEGORY_SEGMENT
          : CATEGORY_SEGMENT
      }

      return acc
    },
    { query: '', map: '' } as QueryArgs
  )

  return !hasFacetsBadArgs(queryArgs)
    ? `${queryArgs.query}?map=${queryArgs.map}`
    : null
}

const normalizedFiltersFromFacets = async (facets: SearchFacets) => {
  const specificationFilters = facets.SpecificationFilters

  return Object.keys(specificationFilters).reduce((acc, filterKey) => {
    const fieldFacets = specificationFilters[filterKey]
    const normalizedFilterName = normalizeName(filterKey)

    acc[normalizedFilterName] = fieldFacets[0].Map

    return acc
  }, {} as Record<string, string>)
}

const getCategoryFilters = async (
  search: Search,
  query: string,
  cacheKeyPrefix: string
) => {
  const facets = await getOrSet<SearchFacets>(
    facetsCache,
    `${cacheKeyPrefix}:${query}`,
    () => search.facets(query)
  )

  return normalizedFiltersFromFacets(facets)
}

export const mountCompatibilityQuery = async (params: {
  search: Search
  args: any
  cacheKeyPrefix: string
}) => {
  const { search, args, cacheKeyPrefix } = params
  const { query, map } = args
  const querySegments = query.startsWith(PATH_SEPARATOR)
    ? query.split(PATH_SEPARATOR).slice(1)
    : query.split(PATH_SEPARATOR)

  const categoryTreeFinder = new CategoryTreeSegmentsFinder(
    { search },
    querySegments,
    cacheKeyPrefix
  )

  const categories = await categoryTreeFinder.find()
  const facetsQuery = getFacetsQueryFromCategories(categories)

  const fieldsLookup = facetsQuery
    ? await getCategoryFilters(search, facetsQuery, cacheKeyPrefix)
    : {}

  const mapSegments = fillCategoriesMapSegments(categories, map)

  const compatMapSegments = []
  const compatQuerySegments = []

  for (
    let segmentIndex = 0;
    segmentIndex < querySegments.length;
    segmentIndex++
  ) {
    const querySegment = querySegments[segmentIndex]

    const [fieldName, fieldValue] = querySegment.split('_')
    const compatMapSegmentField = fieldsLookup[fieldName]

    const mapSegment =
      compatMapSegmentField || mapSegments.shift() || FULL_TEXT_SEGMENT

    compatMapSegments.push(mapSegment)
    compatQuerySegments.push(fieldValue || querySegment)
  }

  const compatibilityQuery = compatQuerySegments.join('/')
  const compatibilityMap = compatMapSegments.join(',')

  return { query: compatibilityQuery, map: compatibilityMap }
}

export const toCompatibilityArgs = async (
  search: Search,
  args: QueryArgs,
  cacheKeyPrefix: string
): Promise<QueryArgs | undefined> => {
  const { query, map } = args

  if (!query) {
    return
  }

  const { query: compatibilityQuery, map: compatibilityMap } = await getOrSet(
    searchUrlsCache,
    `${cacheKeyPrefix}:${query}:${map ?? ''}`,
    () => mountCompatibilityQuery({ search, args, cacheKeyPrefix })
  )

  return { query: compatibilityQuery, map: compatibilityMap }
}
