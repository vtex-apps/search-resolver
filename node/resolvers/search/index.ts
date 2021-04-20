import type {
  VBase
} from '@vtex/api';
import {
  NotFoundError,
  UserInputError,
  createMessagesLoader
} from '@vtex/api'
import { head, isEmpty, isNil, test, pathOr } from 'ramda'

import { resolvers as assemblyOptionResolvers } from './assemblyOption'
import { resolvers as autocompleteResolvers } from './autocomplete'
import { resolvers as brandResolvers } from './brand'
import { resolvers as categoryResolvers } from './category'
import { resolvers as discountResolvers } from './discount'
import { resolvers as facetsResolvers } from './facets'
import { resolvers as itemMetadataResolvers } from './itemMetadata'
import { resolvers as itemMetadataPriceTableItemResolvers } from './itemMetadataPriceTableItem'
import { resolvers as itemMetadataUnitResolvers } from './itemMetadataUnit'
import { resolvers as offerResolvers } from './offer'
import { resolvers as productResolvers } from './product'
import { resolvers as recommendationResolvers } from './recommendation'
import { resolvers as skuResolvers } from './sku'
import { resolvers as skuSpecificationResolver } from './skuSpecification'
import { resolvers as skuSpecificationFieldResolver } from './skuSpecificationField'
import { resolvers as skuSpecificationValueResolver } from './skuSpecificationValue'
import { resolvers as productPriceRangeResolvers } from './productPriceRange'
import { getSearchMetaData } from './modules/metadata'
import {
  SearchCrossSellingTypes,
  getMapAndPriceRangeFromSelectedFacets,
} from './utils'
import { toCompatibilityArgs } from './newURLs'
import { PATH_SEPARATOR, MAP_VALUES_SEP, SELLERS_BUCKET } from './constants'
import { shouldTranslateToTenantLocale } from '../../utils/i18n'
import {
  buildAttributePath,
  convertOrderBy,
  buildBreadcrumb,
} from '../../commons/compatibility-layer'
import { productsCatalog, productsBiggy } from '../../commons/products'
import {
  attributesToFilters,
  sortAttributeValuesByCatalog,
} from '../../utils/attributes'
import { staleFromVBaseWhileRevalidate } from '../../utils/vbase'
import type { Checkout } from '../../clients/checkout'
import setFilterVisibility from '../../utils/setFilterVisibility'

interface ProductIndentifier {
  field: 'id' | 'slug' | 'ean' | 'reference' | 'sku'
  value: string
}

interface ProductArgs {
  slug?: string
  identifier?: ProductIndentifier
  regionId?: string
  salesChannel?: number
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
  values: string[]
  salesChannel?: string | null,
  regionId?: string | null
}

interface Region {
  id: string
  sellers: Array<{
    id: string
    name: string
  }>
}

const inputToSearchCrossSelling = {
  [CrossSellingInput.buy]: SearchCrossSellingTypes.whoboughtalsobought,
  [CrossSellingInput.view]: SearchCrossSellingTypes.whosawalsosaw,
  [CrossSellingInput.similars]: SearchCrossSellingTypes.similars,
  [CrossSellingInput.viewAndBought]: SearchCrossSellingTypes.whosawalsobought,
  [CrossSellingInput.accessories]: SearchCrossSellingTypes.accessories,
  [CrossSellingInput.suggestions]: SearchCrossSellingTypes.suggestions,
}

const getTradePolicyFromSelectedFacets = (selectedFacets: SelectedFacet[] = []): string | null => {
  const tradePolicy = selectedFacets.filter(selectedFacet => selectedFacet.key === "trade-policy")

  return tradePolicy.length > 0 ? tradePolicy[0].value : null
}

const getRegionIdFromSelectedFacets = (selectedFacets: SelectedFacet[] = []): [(string | null), SelectedFacet[]] => {
  let regionId = null

  const regionIdIndex = selectedFacets.findIndex(selectedFacet => selectedFacet.key === "region-id")

  if(regionIdIndex > -1) {
    regionId = selectedFacets[regionIdIndex].value

    selectedFacets.splice(regionIdIndex, 1)
  }

  return [regionId, selectedFacets]
}

const buildVtexSegment = (vtexSegment?: SegmentData, tradePolicy?: number, regionId?: string | null): string => {
    const cookie = {
      regionId,
      channel: tradePolicy,
      utm_campaign: vtexSegment?.utm_campaign || "",
      utm_source: vtexSegment?.utm_source || "",
      utmi_campaign: vtexSegment?.utmi_campaign || "",
      currencyCode: vtexSegment?.currencyCode || "",
      currencySymbol: vtexSegment?.currencySymbol || "",
      countryCode: vtexSegment?.countryCode || "",
      cultureInfo: vtexSegment?.cultureInfo || "",
    }

    return new Buffer(JSON.stringify(cookie)).toString('base64');
}

/**
 * There is an URL pattern in VTEX where the number of mapSegments doesn't match the number of querySegments. This function deals with these cases.
 * Since this should not be a search concern, this function will be removed soon.
 *
 * @param {Context} ctx
 * @param {QueryArgs} args
 * @returns
 */
const getCompatibilityArgsFromSelectedFacets = async (
  ctx: Context,
  args: QueryArgs
) => {
  const { selectedFacets, query } = args

  if (!selectedFacets || selectedFacets.length === 0 || !query) {
    return args
  }

  const [map, priceRange] = getMapAndPriceRangeFromSelectedFacets([
    ...selectedFacets,
  ])

  args.map = map

  if (isLegacySearchFormat({ query: args.query, map: args.map })) {
    return args
  }

  const compatibilityArgs = (await getCompatibilityArgs(ctx, args)) as QueryArgs

  const mapSegments = compatibilityArgs.map!.split(MAP_VALUES_SEP)
  const querySegments = compatibilityArgs.query!.split(PATH_SEPARATOR)

  args.selectedFacets = mapSegments.map((map, index) => {
    return {
      key: map,
      value: querySegments[index],
    }
  })

  if (priceRange) {
    args.selectedFacets.push({
      key: 'priceRange',
      value: priceRange,
    })
  }

  return args
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

const getProductsCountAndPage = (from: number, to: number): [number, number] => {
  const count = to - from + 1
  const page = Math.round((to + 1) / count)

  return [count, page]
}

const noop = () => { }

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
      search.productById(product.productId, undefined, undefined, false).catch(noop)
    )
}

export const fieldResolvers = {
  ...autocompleteResolvers,
  ...brandResolvers,
  ...categoryResolvers,
  ...itemMetadataResolvers,
  ...itemMetadataUnitResolvers,
  ...itemMetadataPriceTableItemResolvers,
  ...offerResolvers,
  ...discountResolvers,
  ...facetsResolvers,
  ...productResolvers,
  ...recommendationResolvers,
  ...skuResolvers,
  ...skuSpecificationResolver,
  ...skuSpecificationFieldResolver,
  ...skuSpecificationValueResolver,
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

  const formattedArgs = compatArgs ? { ...args, ...compatArgs } : args

  // VTEX search does not understand brand/category/department and fails with error:
  //  Query contains something not suited for search
  formattedArgs.map = formattedArgs.map
    ?.replace(/brand/g, 'b')
    ?.replace(/category(-[0-9]*)?/g, 'c')

  return formattedArgs
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

const getSellers = async (
  vbase: VBase,
  checkout: Checkout,
  channel?: number,
  regionId?: string | null,
) => {
  if (!regionId) {
    return []
  }

  const result = await staleFromVBaseWhileRevalidate(
    vbase,
    `${SELLERS_BUCKET}`,
    regionId,
    async (params: { regionId: string; checkout: Checkout }) => params.checkout.regions(params.regionId, channel),
    { regionId, checkout },
    {
      expirationInMinutes: 10,
    }
  )

  return result?.find((region: Region) => region.id === regionId)?.sellers
}

const buildSpecificationFiltersAsFacets = (specificationFilters: string[]): SelectedFacet[] => {
  return specificationFilters.map((specificationFilter: string) => {
    const [key, value] = specificationFilter.split(":")

    return { key, value }
  })
}

const buildCategoriesAndSubcategoriesAsFacets = (categories: string): SelectedFacet[] => {
  const categoriesAndSubcategories = categories.split("/");

  return categoriesAndSubcategories.map((c: string) => {
    return { key: "c", value: c }
  })
}

const buildSelectedFacets = (args: SearchArgs) => {
  const selectedFacets: SelectedFacet[] = []

  if (args.priceRange) {
    selectedFacets.push({ key: "priceRange", value: args.priceRange })
  }

  if (args.category) {
    selectedFacets.push(...buildCategoriesAndSubcategoriesAsFacets(args.category))
  }

  if (args.collection) {
    selectedFacets.push({ key: "productClusterIds", value: args.collection })
  }

  if (args.specificationFilters) {
    selectedFacets.push(...buildSpecificationFiltersAsFacets(args.specificationFilters))
  }

  return selectedFacets
}

export const queries = {
  autocomplete: async (
    _: any,
    args: { maxRows: number; searchTerm?: string },
    ctx: Context
  ) => {
    const {
      clients: { search },
    } = ctx

    if (!args.searchTerm) {
      throw new UserInputError('No search term provided')
    }

    const translatedTerm = await translateToStoreDefaultLanguage(
      ctx,
      args.searchTerm
    )

    const { itemsReturned } = await search.autocomplete({
      maxRows: args.maxRows,
      searchTerm: translatedTerm,
    })

    return {
      cacheId: args.searchTerm,
      itemsReturned,
    }
  },
  facets: async (_: any, args: FacetsInput, ctx: any) => {
    args = (await getCompatibilityArgsFromSelectedFacets(
      ctx,
      args
    )) as FacetsInput

    let { fullText, searchState } = args

    if (fullText) {
      fullText = await translateToStoreDefaultLanguage(ctx, args.fullText!)
    }

    const {
      clients: { biggySearch, search, checkout, vbase },
      vtex: { segment },
    } = ctx

    const [regionId, selectedFacets] = getRegionIdFromSelectedFacets(args.selectedFacets)

    const tradePolicy = getTradePolicyFromSelectedFacets(selectedFacets) || segment?.channel

    const sellers = await getSellers(vbase, checkout, tradePolicy, regionId || segment?.regionId)

    const biggyArgs = {
      searchState,
      query: fullText,
      attributePath: buildAttributePath(selectedFacets),
      tradePolicy,
      sellers,
      hideUnavailableItems: args.hideUnavailableItems,
    }

    const result = await biggySearch.facets(biggyArgs)

    // FIXME: This is used to sort values based on catalog API.
    // Remove it when it is not necessary anymore
    if (result && result.attributes) {
      result.attributes = await Promise.all(
        result.attributes.map(async (attribute: any) => {
          if (
            attribute.type === 'text' &&
            attribute.ids &&
            attribute.ids.length
          ) {
            const catalogValues = await search.getFieldValues(attribute.ids[0])

            sortAttributeValuesByCatalog(attribute, catalogValues)
          }

          return attribute
        })
      )
    }

    const breadcrumb = buildBreadcrumb(
      result.attributes || [],
      decodeURIComponent(args.fullText),
      args.selectedFacets
    )

    const attributesWithVisibilitySet = await setFilterVisibility(vbase, search, result.attributes ?? [])

    const response = attributesToFilters({
      breadcrumb,
      total: result.total,
      attributes: attributesWithVisibilitySet,
      removeHiddenFacets: args.removeHiddenFacets,
    })

    return {
      facets: response,
      queryArgs: {
        map: args.map,
        query: args.query,
        selectedFacets: args.selectedFacets,
      },
      breadcrumb,
    }
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

    const cookie: SegmentData | undefined = ctx.vtex.segment

    const salesChannel = rawArgs.salesChannel || cookie?.channel || 1

    const { field, value } = args.identifier

    let products = [] as SearchProduct[]

    const vtexSegment = (!cookie || (!cookie?.regionId && rawArgs.regionId)) ? buildVtexSegment(cookie, salesChannel, rawArgs.regionId) : ctx.vtex.segmentToken

    switch (field) {
      case 'id':
        products = await search.productById(value, vtexSegment, salesChannel)
        break

      case 'slug':
        products = await search.product(value, vtexSegment, salesChannel)
        break

      case 'ean':
        products = await search.productByEan(value, vtexSegment, salesChannel)
        break

      case 'reference':
        products = await search.productByReference(value, vtexSegment, salesChannel)
        break

      case 'sku':
        products = await search.productBySku(value, vtexSegment, salesChannel)
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
      clients: { biggySearch, vbase, checkout },
      vtex: { segment }
    } = ctx

    const { query, to, from, orderBy, simulationBehavior, hideUnavailableItems } = args

    if (to && to > 2500) {
      throw new UserInputError(
        `The maximum value allowed for the 'to' argument is 2500`
      )
    }

    const selectedFacets: SelectedFacet[] = buildSelectedFacets(args)

    const sellers = await getSellers(vbase, checkout, segment?.channel, segment?.regionId)

    const biggyArgs: SearchResultArgs = {
      fullText: query,
      attributePath: buildAttributePath(selectedFacets),
      tradePolicy: segment && segment.channel,
      query,
      sellers,
      sort: convertOrderBy(orderBy),
      hideUnavailableItems,
    }

    if (to !== null && from !== null) {
      const [count, page] = getProductsCountAndPage(from, to)

      biggyArgs.count = count
      biggyArgs.page = page
    }

    const products = await biggySearch.productSearch(biggyArgs)

    const regionId = segment?.regionId
    const convertedProducts = await productsBiggy({ ctx, simulationBehavior, searchResult: products, regionId })

    convertedProducts.forEach(product => product.cacheId = `sae-productSearch-${product.cacheId || product.linkText}`)

    return convertedProducts
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

    const vtexSegment =  (!ctx.vtex.segment || (!ctx.vtex.segment?.regionId && args.regionId)) ? buildVtexSegment(ctx.vtex.segment, Number(args.salesChannel), args.regionId) : ctx.vtex.segmentToken

    switch (field) {
      case 'id':
        products = await search.productsById(values, vtexSegment, salesChannel)
        break

      case 'ean':
        products = await search.productsByEan(values, vtexSegment, salesChannel)
        break

      case 'reference':
        products = await search.productsByReference(values, vtexSegment, salesChannel)
        break

      case 'sku':
        products = await search.productsBySku(values, vtexSegment, salesChannel)
        break
    }

    if (products.length > 0) {
      return products
    }

    throw new NotFoundError(`No products were found with requested ${field}`)
  },

  productSearch: async (_: any, args: ProductSearchInput, ctx: any) => {
    args = (await getCompatibilityArgsFromSelectedFacets(
      ctx,
      args
    )) as ProductSearchInput

    const { biggySearch, vbase, checkout } = ctx.clients
    const { segment } = ctx.vtex
    const {
      from,
      to,
      fullText,
      fuzzy,
      operator,
      searchState,
      simulationBehavior,
      hideUnavailableItems,
    } = args

    let [regionId, selectedFacets] = getRegionIdFromSelectedFacets(args.selectedFacets)

    regionId = regionId || segment?.regionId

    const tradePolicy = getTradePolicyFromSelectedFacets(args.selectedFacets) || segment?.channel

    const sellers = await getSellers(vbase, checkout, tradePolicy, regionId)

    const [count, page] = getProductsCountAndPage(from, to)

    const biggyArgs = {
      page,
      count,
      fuzzy,
      operator,
      searchState,
      attributePath: buildAttributePath(selectedFacets),
      query: fullText,
      tradePolicy,
      sort: convertOrderBy(args.orderBy),
      sellers,
      hideUnavailableItems,
    }

    const result = await biggySearch.productSearch(biggyArgs)

    const productResolver = args.productOriginVtex
      ? productsCatalog
      : productsBiggy

    const convertedProducts = await productResolver({ ctx, simulationBehavior, searchResult: result, tradePolicy, regionId })

    // Add prefix to the cacheId to avoid conflicts. Repeated cacheIds in the same page are causing strange behavior.
    convertedProducts.forEach(product => product.cacheId = `sae-productSearch-${product.cacheId || product.linkText}`)

    return {
      searchState,
      products: convertedProducts,
      recordsFiltered: result.total,
      correction: result.correction,
      fuzzy: result.fuzzy,
      operator: result.operator,
      redirect: result.redirect,
    }
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
      args.query ?? '',
      args.map ?? '',
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
  topSearches: async (_: any, __: any, ctx: Context) => {
    const { biggySearch } = ctx.clients

    return await biggySearch.topSearches()
  },
  autocompleteSearchSuggestions: (
    _: any,
    args: { fullText: string },
    ctx: Context
  ) => {
    const { biggySearch } = ctx.clients

    return biggySearch.autocompleteSearchSuggestions(args)
  },
  productSuggestions: async (
    _: any,
    args: SuggestionProductsArgs,
    ctx: Context
  ) => {
    const {
      clients: { biggySearch, checkout, vbase },
      vtex: { segment },
    } = ctx

    const regionId = args.regionId || segment?.regionId

    const tradePolicy = args.salesChannel || segment?.channel

    const sellers = await getSellers(vbase, checkout, tradePolicy, regionId)

    const result = await biggySearch.suggestionProducts({
      ...args,
      salesChannel: tradePolicy,
      sellers
    })

    const productResolver = args.productOriginVtex
      ? productsCatalog
      : productsBiggy

    const convertedProducts = productResolver(
      {
        ctx,
        searchResult: result,
        simulationBehavior: args.simulationBehavior,
        tradePolicy: String(tradePolicy),
        regionId
      }
    )

    const {
      count,
      operator,
      correction: { misspelled },
    } = result

    return { count, operator, misspelled, products: convertedProducts }
  },
  banners: (
    _: any,
    args: { fullText: string; selectedFacets: SelectedFacet[] },
    ctx: Context
  ) => {
    const { biggySearch } = ctx.clients

    return biggySearch.banners({
      attributePath: buildAttributePath(args.selectedFacets),
      fullText: args.fullText,
    })
  },
  correction: (_: any, args: { fullText: string }, ctx: Context) => {
    const { biggySearch } = ctx.clients

    return biggySearch.correction(args)
  },
  searchSuggestions: (_: any, args: { fullText: string }, ctx: Context) => {
    const { biggySearch } = ctx.clients

    return biggySearch.searchSuggestions(args)
  },
}
