/* eslint-disable no-console */
import { NotFoundError, UserInputError, createMessagesLoader } from '@vtex/api'
import {
  head,
  isEmpty,
  isNil,
  path,
  test,
  pathOr,
  pluck,
  tail,
  zip,
} from 'ramda'

import { resolvers as assemblyOptionResolvers } from './assemblyOption'
// import { resolvers as autocompleteResolvers } from './autocomplete'
import { resolvers as brandResolvers } from './brand'
import { resolvers as categoryResolvers } from './category'
import { resolvers as discountResolvers } from './discount'
import { resolvers as facetsResolvers } from './facets'
import { resolvers as itemMetadataResolvers } from './itemMetadata'
import { resolvers as itemMetadataPriceTableItemResolvers } from './itemMetadataPriceTableItem'
import { resolvers as itemMetadataUnitResolvers } from './itemMetadataUnit'
import { emptyTitleTag, getSearchMetaData } from './modules/metadata'
import { resolvers as offerResolvers } from './offer'
import { resolvers as productResolvers } from './product'
import { resolvers as productSearchResolvers } from './productSearch'
import { resolvers as recommendationResolvers } from './recommendation'
import { resolvers as breadcrumbResolvers } from './searchBreadcrumb'
import { resolvers as skuResolvers } from './sku'
import { resolvers as skuSpecificationResolver } from './skuSpecification'
import { resolvers as skuSpecificationFieldResolver } from './skuSpecificationField'
import { resolvers as skuSpecificationValueResolver } from './skuSpecificationValue'
import { resolvers as productPriceRangeResolvers } from './productPriceRange'
import {
  SearchCrossSellingTypes,
  getMapAndPriceRangeFromSelectedFacets,
} from './utils'
// import * as searchStats from '../stats/searchStats'
import { toCompatibilityArgs, hasFacetsBadArgs } from './newURLs'
import { PATH_SEPARATOR, MAP_VALUES_SEP, FACETS_BUCKET } from './constants'
import { staleFromVBaseWhileRevalidate } from '../../utils/vbase'
import { shouldTranslateToTenantLocale } from '../../utils/i18n'

interface ProductIndentifier {
  field: 'id' | 'slug' | 'ean' | 'reference' | 'sku'
  value: string
}

interface ProductArgs {
  slug?: string
  identifier?: ProductIndentifier
}

enum CrossSellingInput {
  view = 'view',
  buy = 'buy',
  similars = 'similars',
  viewAndBought = 'viewAndBought',
  suggestions = 'suggestions',
  accessories = 'accessories',
}

interface ProductRecommendationArg {
  identifier?: ProductIndentifier
  type?: CrossSellingInput
}

interface ProductsByIdentifierArgs {
  field: 'id' | 'ean' | 'reference' | 'sku'
  values: [string]
  salesChannel?: string
}

interface ProductSuggestionsArgs {
  fullText: string
  facetKey: string
  facetValue: string
  productOriginVtex: string
  simulationBehavior: 'skip' | 'default'
  hideUnavailableItems: boolean
  regionId: string
  salesChannel: number
  orderBy: string
  count: number
  shippingOptions: [string]
  variant: string
}

const inputToSearchCrossSelling = {
  [CrossSellingInput.buy]: SearchCrossSellingTypes.whoboughtalsobought,
  [CrossSellingInput.view]: SearchCrossSellingTypes.whosawalsosaw,
  [CrossSellingInput.similars]: SearchCrossSellingTypes.similars,
  [CrossSellingInput.viewAndBought]: SearchCrossSellingTypes.whosawalsobought,
  [CrossSellingInput.accessories]: SearchCrossSellingTypes.accessories,
  [CrossSellingInput.suggestions]: SearchCrossSellingTypes.suggestions,
}

const translateToStoreDefaultLanguage = async (
  ctx: Context,
  term: string
): Promise<string> => {
  const {
    clients,
    state,
    vtex: { locale: from, tenant },
  } = ctx
  const { locale: to } = tenant!

  if (!shouldTranslateToTenantLocale(ctx)) {
    // Do not translate if string already in correct language
    return term
  }

  if (!state.messagesTenantLanguage) {
    state.messagesTenantLanguage = createMessagesLoader(clients, to)
  }

  return state.messagesTenantLanguage!.load({
    from: from!,
    content: term,
  })
}

const noop = () => {}

// Does prefetching and warms up cache for up to the 10 first elements of a search, so if user clicks on product page
const searchFirstElements = (
  products: SearchProduct[],
  from: number | null = 0,
  search: Context['clients']['search']
) => {
  if (from !== 0 || from == null) {
    // We do not want this for pages other than the first
    return
  }
  products
    .slice(0, Math.min(10, products.length))
    .forEach(product =>
      search.productById(product.productId, false).catch(noop)
    )
}

export const fieldResolvers = {
  ...brandResolvers,
  ...categoryResolvers,
  ...facetsResolvers,
  ...itemMetadataResolvers,
  ...itemMetadataUnitResolvers,
  ...itemMetadataPriceTableItemResolvers,
  ...offerResolvers,
  ...discountResolvers,
  ...productResolvers,
  ...recommendationResolvers,
  ...skuResolvers,
  ...skuSpecificationResolver,
  ...skuSpecificationFieldResolver,
  ...skuSpecificationValueResolver,
  ...breadcrumbResolvers,
  ...productSearchResolvers,
  ...assemblyOptionResolvers,
  ...productPriceRangeResolvers,
}

export const getCompatibilityArgs = async <T extends QueryArgs>(
  ctx: Context,
  args: T
) => {
  const {
    clients: { vbase, search },
  } = ctx
  const compatArgs = isLegacySearchFormat(args)
    ? args
    : await toCompatibilityArgs(vbase, search, args)
  return compatArgs ? { ...args, ...compatArgs } : args
}

// Legacy search format is our search with path?map=c,c,specificationFilter
// Where it has specificationFilters and all segments in path are mapped in `map` querystring
const isLegacySearchFormat = ({
  query,
  map,
}: {
  query: string
  map?: string
}) => {
  if (!map) {
    return false
  }
  return map.split(MAP_VALUES_SEP).length === query.split(PATH_SEPARATOR).length
}

const isValidProductIdentifier = (identifier: ProductIndentifier | undefined) =>
  !!identifier && !isNil(identifier.value) && !isEmpty(identifier.value)

const metadataResolverNames = ['titleTag', 'metaTagDescription']

// This method checks the requested fields in the query and see if the search metadata are being asked.
const isQueryingMetadata = (info: any) => {
  const selectedFields =
    path<any[]>(['fieldNodes', '0', 'selectionSet', 'selections'], info) || []
  return selectedFields.some(
    ({ name: { value } }: any) => metadataResolverNames.indexOf(value) >= 0
  )
}

const filterSpecificationFilters = ({
  query,
  map,
  ...rest
}: Required<FacetsArgs>) => {
  const queryArray = query.split('/')
  const mapArray = map.split(',')

  if (queryArray.length < mapArray.length) {
    return {
      ...rest,
      query,
      map,
    }
  }

  const queryAndMap = zip(queryArray, mapArray)
  const relevantArgs = [
    head(queryAndMap),
    ...tail(queryAndMap).filter(
      ([, tupleMap]) => tupleMap === 'c' || tupleMap === 'ft'
    ),
  ]
  const finalQuery = pluck(0, relevantArgs).join('/')
  const finalMap = pluck(1, relevantArgs).join(',')

  return {
    ...rest,
    map: finalMap,
    query: finalQuery,
  }
}

const getTranslatedSearchTerm = async (
  query: SearchArgs['query'],
  map: SearchArgs['map'],
  ctx: Context
) => {
  if (!query || !map || !shouldTranslateToTenantLocale(ctx)) {
    return query
  }
  const ftSearchIndex = map.split(',').findIndex(m => m === 'ft')
  if (ftSearchIndex === -1) {
    return query
  }
  const queryArray = query.split('/')
  const queryUnit = queryArray[ftSearchIndex]
  const translated = await translateToStoreDefaultLanguage(ctx, queryUnit)
  const queryTranslated = [
    ...queryArray.slice(0, ftSearchIndex),
    translated,
    ...queryArray.slice(ftSearchIndex + 1),
  ]
  return queryTranslated.join('/')
}

export const queries = {
  /**
   * Retrieves a list of product suggestions based on a search term.
   * @param _ Unused parameter.
   * @param args The arguments for the product suggestions query.
   * @param ctx The context object containing the Algolia client.
   * @returns An array of product suggestions.
   * @throws UserInputError if no search term is provided.
   */
  productSuggestions: async (
    _: any,
    args: ProductSuggestionsArgs,
    ctx: Context
  ) => {
    const {
      clients: { algolia },
    } = ctx

    // Check if a search term is provided
    if (!args.fullText) {
      throw new UserInputError('No search term provided')
    }

    // Translate the search term to the default language of the store
    const translatedTerm = await translateToStoreDefaultLanguage(
      ctx,
      args.fullText
    )

    // Retrieve product suggestions from Algolia
    const ret = await algolia.productSuggestions(translatedTerm, {
      length: args.count,
    })

    return ret
  },
  autocomplete: async (
    _: any,
    args: { maxRows: number; searchTerm?: string },
    ctx: Context
  ) => {
    const {
      clients: { algolia },
    } = ctx

    if (!args.searchTerm) {
      throw new UserInputError('No search term provided')
    }

    const translatedTerm = await translateToStoreDefaultLanguage(
      ctx,
      args.searchTerm
    )

    const { itemsReturned } = await algolia.autocomplete({
      maxRows: args.maxRows,
      searchTerm: translatedTerm,
    })

    return {
      cacheId: args.searchTerm,
      itemsReturned,
    }
  },
  facets: async (_: any, args: FacetsArgs, ctx: Context) => {
    const { hideUnavailableItems } = args
    const {
      clients: { search, vbase },
    } = ctx
    console.log('### facets => ', args)
    if (args.selectedFacets) {
      const [map] = getMapAndPriceRangeFromSelectedFacets(args.selectedFacets)
      args.map = map
    }

    args.map = args.map && decodeURIComponent(args.map)

    args.query = await getTranslatedSearchTerm(args.query, args.map, ctx)

    const compatibilityArgs = await getCompatibilityArgs<FacetsArgs>(ctx, args)

    const filteredArgs =
      args.behavior === 'Static'
        ? filterSpecificationFilters({
            ...args,
            query: compatibilityArgs.query,
            map: compatibilityArgs.map,
          } as Required<FacetsArgs>)
        : (compatibilityArgs as Required<FacetsArgs>)

    if (hasFacetsBadArgs(filteredArgs)) {
      throw new UserInputError('No query or map provided')
    }

    const { query: filteredQuery, map: filteredMap } = filteredArgs

    const segmentData = ctx.vtex.segment
    const salesChannel = segmentData?.channel?.toString() || ''
    const unavailableString = hideUnavailableItems
      ? `&fq=isAvailablePerSalesChannel_${salesChannel}:1`
      : ''

    const assembledQuery = `${filteredQuery}?map=${filteredMap}${unavailableString}`

    const facetsResult = await staleFromVBaseWhileRevalidate(
      vbase,
      FACETS_BUCKET,
      assembledQuery.replace(unavailableString, ''),
      search.facets,
      assembledQuery
    )

    const result = {
      ...facetsResult,
      queryArgs: {
        query: compatibilityArgs.query,
        map: compatibilityArgs.map,
      },
    }

    // console.log('### Facet results => ', result)

    return result
  },

  product: async (_: any, rawArgs: ProductArgs, ctx: Context) => {
    const {
      clients: { search },
    } = ctx
    const args =
      rawArgs && isValidProductIdentifier(rawArgs.identifier)
        ? rawArgs
        : { identifier: { field: 'slug', value: rawArgs.slug! } }

    if (!args.identifier) {
      throw new UserInputError('No product identifier provided')
    }

    const { field, value } = args.identifier
    let products = [] as SearchProduct[]

    switch (field) {
      case 'id':
        products = await search.productById(value)
        break
      case 'slug':
        products = await search.product(value)
        break
      case 'ean':
        products = await search.productByEan(value)
        break
      case 'reference':
        products = await search.productByReference(value)
        break
      case 'sku':
        products = await search.productBySku(value)
        break
    }

    if (products.length > 0) {
      return head(products)
    }

    throw new NotFoundError(
      `No product was found with requested ${field} ${JSON.stringify(args)}`
    )
  },

  products: async (_: any, args: SearchArgs, ctx: Context) => {
    const {
      clients: { search },
    } = ctx
    const queryTerm = args.query
    if (queryTerm == null || test(/[?&[\]=]/, queryTerm)) {
      throw new UserInputError(
        `The query term contains invalid characters. query=${queryTerm}`
      )
    }

    if (args.to && args.to > 2500) {
      throw new UserInputError(
        `The maximum value allowed for the 'to' argument is 2500`
      )
    }
    const products = await search.products(args)
    searchFirstElements(products, args.from, ctx.clients.search)
    return products
  },

  productsByIdentifier: async (
    _: any,
    args: ProductsByIdentifierArgs,
    ctx: Context
  ) => {
    const {
      clients: { search },
    } = ctx
    let products = [] as SearchProduct[]
    const { field, values, salesChannel } = args

    switch (field) {
      case 'id':
        products = await search.productsById(values, salesChannel)
        break
      case 'ean':
        products = await search.productsByEan(values, salesChannel)
        break
      case 'reference':
        products = await search.productsByReference(values, salesChannel)
        break
      case 'sku':
        products = await search.productsBySku(values, salesChannel)
        break
    }

    if (products.length > 0) {
      return products
    }

    throw new NotFoundError(`No products were found with requested ${field}`)
  },

  /**
   * This function performs a search for products based on the provided query and selected facets,
   * using the Algolia search engine. It also includes functionality for translating the search term
   * and retrieving search metadata.
   *
   * @param _ The parent value, which is not used in this function.
   * @param args An object containing the arguments for the search, including the query, selected facets, and pagination parameters.
   * @param ctx The context object, which contains client instances and other contextual information.
   * @param info The GraphQL resolve info object, which contains information about the execution state of the query.
   * @returns An object containing the translated arguments, search metadata, and raw search results from Algolia.
   */
  productSearch: async (_: any, args: SearchArgs, ctx: Context, info: any) => {
    const {
      clients: { search, algolia },
    } = ctx

    const queryTerm = args.query

    // Extract map and priceRange from selectedFacets
    if (args.selectedFacets) {
      const [map, priceRange] = getMapAndPriceRangeFromSelectedFacets(
        args.selectedFacets
      )
      args.map = map
      args.priceRange = priceRange
    }

    // Decode the map parameter if it is provided
    args.map = args.map && decodeURIComponent(args.map)

    // Validate the query term and check for any invalid characters
    if (queryTerm == null || test(/[?&[\]=]/, queryTerm)) {
      throw new UserInputError(
        `The query term contains invalid characters. query=${queryTerm}`
      )
    }

    // Check if the 'to' parameter exceeds the maximum allowed value
    if (args.to && args.to > 2500) {
      throw new UserInputError(
        `The maximum value allowed for the 'to' argument is 2500`
      )
    }

    // Translate the search term to the store's default language if necessary
    const query = await getTranslatedSearchTerm(args.query, args.map, ctx)
    const translatedArgs = {
      ...args,
      query,
    }

    // Get compatibility arguments for the search, including legacy search format conversion if needed
    const compatibilityArgs: any = await getCompatibilityArgs<SearchArgs>(
      ctx,
      translatedArgs
    )

    // Map the selected facets to Algolia filter expressions
    const filtersMap = (selectedFacets: any[] | undefined) => {
      let ret: any = []
      selectedFacets?.forEach(facet => {
        if (facet.key === 'b') {
          ret.push(
            `${isNaN(facet.value) ? 'brandSlug' : 'BrandId'}:${facet.value}`
          )
        }
        if (facet.key === 'c') {
          ret.push(`categoriesSlug:${facet.value}`)
        }
      })
      if (ret.length) {
        return ret.join(' AND ')
      }
      return
    }

    // Perform the search using the Algolia search engine
    const algoliaSearchResult = algolia.search(
      compatibilityArgs?.fullText ?? '',
      {
        filters: filtersMap(compatibilityArgs?.selectedFacets),
        offset: compatibilityArgs?.from,
        length:
          parseInt(compatibilityArgs?.to) -
          parseInt(compatibilityArgs?.from) +
          1,
        facets: ['*'],
        sort: compatibilityArgs?.orderBy,
      }
    )

    // Retrieve search metadata if the query includes metadata fields
    const [algoliaProductsRaw, searchMetaData] = await Promise.all([
      algoliaSearchResult,
      isQueryingMetadata(info)
        ? getSearchMetaData(_, compatibilityArgs, ctx)
        : emptyTitleTag,
    ])

    const resources = `${compatibilityArgs?.from}-${parseInt(
      compatibilityArgs?.to
    )}/${algoliaProductsRaw?.nbHits}`

    const algoliaRawMap = {
      status: 200,
      statusText: 'OK',
      headers: {
        resources,
      },
      data: algoliaProductsRaw.hits,
    }

    // Perform additional operations on the search results
    searchFirstElements(algoliaRawMap.data, args.from, search)

    // Return the search results, translated arguments, and search metadata
    const result = {
      translatedArgs: compatibilityArgs,
      searchMetaData,
      productsRaw: algoliaRawMap,
    }

    return result
  },

  productRecommendations: async (
    _: any,
    { identifier, type }: ProductRecommendationArg,
    ctx: Context
  ) => {
    if (identifier == null || type == null) {
      throw new UserInputError('Wrong input provided')
    }
    const searchType = inputToSearchCrossSelling[type]
    let productId = identifier.value
    if (identifier.field !== 'id') {
      const product = await queries.product(_, { identifier }, ctx)
      productId = product!.productId
    }

    const products = await ctx.clients.search.crossSelling(
      productId,
      searchType
    )

    searchFirstElements(products, 0, ctx.clients.search)
    // We add a custom cacheId because these products are not exactly like the other products from search apis.
    // Each product is basically a SKU and you may have two products in response with same ID but each one representing a SKU.
    return products.map(product => {
      const skuId = pathOr('', ['items', '0', 'itemId'], product)
      return {
        ...product,
        cacheId: `${product.linkText}-${skuId}`,
      }
    })
  },

  searchMetadata: async (_: any, args: SearchMetadataArgs, ctx: Context) => {
    const queryTerm = args.query
    if (queryTerm == null || test(/[?&[\]=]/, queryTerm)) {
      throw new UserInputError(
        `The query term contains invalid characters. query=${queryTerm}`
      )
    }

    if (args.selectedFacets) {
      const [map] = getMapAndPriceRangeFromSelectedFacets(args.selectedFacets)
      args.map = map
    }

    const query = await getTranslatedSearchTerm(
      args.query || '',
      args.map || '',
      ctx
    )
    const translatedArgs = {
      ...args,
      query,
    }
    const compatibilityArgs = await getCompatibilityArgs<SearchArgs>(
      ctx,
      translatedArgs as SearchArgs
    )
    return getSearchMetaData(_, compatibilityArgs, ctx)
  },
  /* All search engines need to implement the topSearches, searchSuggestions, and productSuggestions queries.
  VTEX search doesn't support these queries, so it always returns empty results as a placeholder. */
  topSearches: () => {
    console.log('### topSearches')
    return {
      searches: [],
    }
  },
  autocompleteSearchSuggestions: () => {
    console.log('### autocompleteSearchSuggestions')
    return {
      searches: [],
    }
  },
  banners: () => {
    console.log('### banners')
    return {
      banners: [],
    }
  },
  searchSuggestions: () => {
    console.log('### searchSuggestions')
    return {
      searches: [],
    }
  },
  correction: () => {
    console.log('### correction')
    return {
      correction: null,
    }
  },
}
