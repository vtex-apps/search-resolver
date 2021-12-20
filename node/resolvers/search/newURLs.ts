import type { VBase } from '@vtex/api'

import type { Search } from '../../clients/search'
import {
  SEARCH_URLS_BUCKET,
  CATEGORY_SEGMENT,
  FACETS_BUCKET,
  FULL_TEXT_SEGMENT,
} from './constants'
import type { CategoryIdNamePair } from '../../utils/CategoryTreeSegmentsFinder';
import { CategoryTreeSegmentsFinder } from '../../utils/CategoryTreeSegmentsFinder'
import { staleFromVBaseWhileRevalidate } from '../../utils/vbase'
import { searchSlugify } from '../../utils/slug'
import { PATH_SEPARATOR, MAP_SEPARATOR } from '../stats/constants'

export const hasFacetsBadArgs = ({ query, map }: QueryArgs) => !query || !map

export const toCompatibilityArgs = async (vbase:VBase, search: Search, args: QueryArgs): Promise<QueryArgs|undefined> => {
  const {query} = args

  if(!query){
    return
  }

  const { query: compatibilityQuery, map: compatibilityMap } = await staleFromVBaseWhileRevalidate(
    vbase, SEARCH_URLS_BUCKET, query, mountCompatibilityQuery, {vbase, search, args} )

  return { query: compatibilityQuery, map: compatibilityMap }
}

export const mountCompatibilityQuery = async (params: {vbase: VBase, search: Search, args: any}) => {
  const {vbase, search, args} = params
  const { query, map } = args
  const querySegments = query.startsWith(PATH_SEPARATOR)? query.split(PATH_SEPARATOR).slice(1): query.split(PATH_SEPARATOR)

  const categoryTreeFinder = new CategoryTreeSegmentsFinder({vbase, search}, querySegments)
  const categories = await categoryTreeFinder.find()
  const facetsQuery = getFacetsQueryFromCategories(categories)
  
  const fieldsLookup = facetsQuery? await getCategoryFilters(vbase, search, facetsQuery): {}
  const mapSegments = fillCategoriesMapSegments(categories, map)

  const compatMapSegments = []
  const compatQuerySegments = []

  for(let segmentIndex = 0; segmentIndex < querySegments.length; segmentIndex++ ) {
    const querySegment = querySegments[segmentIndex]
    
    const [fieldName, fieldValue] = querySegment.split('_')
    const compatMapSegmentField = fieldsLookup[fieldName]
    
    const mapSegment = compatMapSegmentField || mapSegments.shift() || FULL_TEXT_SEGMENT

    compatMapSegments.push(mapSegment)
    compatQuerySegments.push(fieldValue || querySegment)
  }

  const compatibilityQuery = compatQuerySegments.join('/')
  const compatibilityMap = compatMapSegments.join(',')

  return { query: compatibilityQuery, map: compatibilityMap}
}

const normalizeName = (name: string): string => searchSlugify(name)

const fillCategoriesMapSegments = (categories: Array<CategoryIdNamePair|null>, map: string): Array<string|undefined> => {
  const mapSegments = map.split(MAP_SEPARATOR).filter(segment=> segment !== CATEGORY_SEGMENT)
  const segmentsFound = []

  for( const category of categories){
    if(!category){
      segmentsFound.push(mapSegments.shift())
    }else{
      segmentsFound.push(CATEGORY_SEGMENT)
    }
  }

  return [...segmentsFound, ...mapSegments]
}

const getFacetsQueryFromCategories = (categories: Array<CategoryIdNamePair|null>) => {
  const queryArgs = categories.reduce((acc: QueryArgs, category) => {
    if(category){
      acc.query = acc.query? acc.query + PATH_SEPARATOR + category.name.toLocaleLowerCase(): category.name.toLocaleLowerCase()
      acc.map = acc.map? acc.map + MAP_SEPARATOR + CATEGORY_SEGMENT: CATEGORY_SEGMENT
    }

    return acc
  }, {query: '', map: ''} as QueryArgs)

  return !hasFacetsBadArgs(queryArgs)? `${queryArgs.query}?map=${queryArgs.map}`: null
}

const getCategoryFilters = async (vbase: VBase, search: Search, query: string) => {
  const facets = await staleFromVBaseWhileRevalidate<SearchFacets>(
    vbase, FACETS_BUCKET, query, search.facets, query)

  return normalizedFiltersFromFacets(facets)
}

const normalizedFiltersFromFacets = async (facets: SearchFacets) => {
  const specificationFilters = facets['SpecificationFilters']

  return Object.keys(specificationFilters).reduce((acc, filterKey) => {
    const facets = specificationFilters[filterKey]
    const normalizedFilterName = normalizeName(filterKey)

    acc[normalizedFilterName] = facets[0].Map

    return acc
  }, {} as Record<string, string>)
}
