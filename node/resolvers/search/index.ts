import {
  NotFoundError,
  UserInputError,
  createMessagesLoader,
} from '@vtex/api'
import { head, isEmpty, isNil, test, pathOr } from 'ramda'

import { resolvers as assemblyOptionResolvers } from './assemblyOption'
import { resolvers as autocompleteResolvers } from './autocomplete'
import { resolvers as brandResolvers } from './brand'
import { resolvers as categoryResolvers } from './category'
import { resolvers as discountResolvers } from './discount'
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
import { resolvers as searchBreadcrumbResolvers } from './searchBreadcrumb'
import { getSearchMetaData } from './modules/metadata'
import {
  SearchCrossSellingTypes,
  getMapAndPriceRangeFromSelectedFacets,
  validMapAndQuery,
} from './utils'
import { toCompatibilityArgs } from './newURLs'
import { PATH_SEPARATOR, MAP_VALUES_SEP } from './constants'
import { shouldTranslateToTenantLocale } from '../../utils/i18n'
import {
  buildAttributePath,
  convertOrderBy,
} from '../../commons/compatibility-layer'
import { getWorkspaceSearchParamsFromStorage } from '../../routes/workspaceSearchParams'

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

const inputToSearchCrossSelling = {
  [CrossSellingInput.buy]: SearchCrossSellingTypes.whoboughtalsobought,
  [CrossSellingInput.view]: SearchCrossSellingTypes.whosawalsosaw,
  [CrossSellingInput.similars]: SearchCrossSellingTypes.similars,
  [CrossSellingInput.viewAndBought]: SearchCrossSellingTypes.whosawalsobought,
  [CrossSellingInput.accessories]: SearchCrossSellingTypes.accessories,
  [CrossSellingInput.suggestions]: SearchCrossSellingTypes.suggestions,
}

const buildVtexSegment = (vtexSegment?: SegmentData, tradePolicy?: number, regionId?: string | null): string => {
    const cookie = {
      regionId: regionId,
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
  ...productResolvers,
  ...recommendationResolvers,
  ...skuResolvers,
  ...skuSpecificationResolver,
  ...skuSpecificationFieldResolver,
  ...skuSpecificationValueResolver,
  ...assemblyOptionResolvers,
  ...productPriceRangeResolvers,
  ...searchBreadcrumbResolvers,
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

    let { selectedFacets } = args

    const {
      clients: { intelligentSearchApi },
    } = ctx

    const biggyArgs: {[key:string]: any}  = {
      ...args
    }

    // unnecessary field. It's is an object and breaks the @vtex/api cache
    delete biggyArgs.selectedFacets


    const result = await intelligentSearchApi.facets({...biggyArgs, query: args.fullText}, buildAttributePath(selectedFacets))

    const { facets } = result

    const productToGetTotal = await intelligentSearchApi.productSearch({...biggyArgs, from: 0, to: 1, query: ''}, buildAttributePath(selectedFacets))
    const recordsTotal =  productToGetTotal.recordsFiltered

    const allProducts = await intelligentSearchApi.productSearch({...biggyArgs, from: 0, to: recordsTotal, query: ''}, buildAttributePath(selectedFacets))
    const greyProducts = removeBlueProducts(allProducts)
    console.log('allProducts.products.length', allProducts.products.length)
    console.log('greyProducts.length', greyProducts.length)
    if (ctx.vtex.tenant) {
      ctx.translated = result.translated
    }
    const newFacet: any[] = []
    facets.forEach((facet: any) => {
      if (facet.name === 'Brand'){
        const facetAux = facet
        facetAux.values.forEach((value: any) => {
          if (value.name === 'Nestle') {
            value.quantity -= 1
            if (value.quantity === 0) {
              facetAux.values = facetAux.values.filter((v: any) => v.name !== 'Nestle')
              facetAux.quantity -= 1
            }
          }
        })
        newFacet.push(facetAux)
      }else{
        newFacet.push(facet)
      }
    })
    // console.log('newFacet', newFacet)
    /*newFacet.forEach((facet: any) => {
      console.log('new facet', facet)
    })*/

    const resultAux = {...result, facets: newFacet}
    return resultAux
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

    let cookie: SegmentData | undefined = ctx.vtex.segment

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
      clients: { intelligentSearchApi },
    } = ctx
    const {
      to,
      orderBy
    } = args

    if (to && to > 2500) {
      throw new UserInputError(
        `The maximum value allowed for the 'to' argument is 2500`
      )
    }

    const selectedFacets: SelectedFacet[] = buildSelectedFacets(args)
    const workspaceSearchParams = await getWorkspaceSearchParamsFromStorage(ctx)

    const biggyArgs = {
      ...args,
      sort: convertOrderBy(orderBy),
      ...workspaceSearchParams,
    }

    // unnecessary field. It's is an object and breaks the @vtex/api cache
    delete biggyArgs.selectedFacets

    const result = await intelligentSearchApi.productSearch(biggyArgs, buildAttributePath(selectedFacets))

    if (ctx.vtex.tenant) {
      ctx.translated = result.translated
    }
    console.log('products result', result.products)
    return result.products
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

    if (!validMapAndQuery(args.query, args.map)) {
      ctx.vtex.logger.warn({
        message: 'Invalid map or query',
        query: args.query,
        map: args.map
      })
    }

    const { intelligentSearchApi } = ctx.clients
    const {
      selectedFacets,
      fullText
    } = args

    const workspaceSearchParams = await getWorkspaceSearchParamsFromStorage(ctx)

    const biggyArgs: {[key:string]: any} = {
      ...args,
      query: fullText,
      sort: convertOrderBy(args.orderBy),
      ...workspaceSearchParams,
    }

    // unnecessary field. It's is an object and breaks the @vtex/api cache
    delete biggyArgs.selectedFacets
    const result = await intelligentSearchApi.productSearch({...biggyArgs}, buildAttributePath(selectedFacets))

    const recordsTotal =  result.recordsFiltered

    const resultToRemoveGreyTotal = await intelligentSearchApi.productSearch({...biggyArgs, from: 0, to: recordsTotal}, buildAttributePath(selectedFacets))
    const blueProductsLength = removeGreyProducts(resultToRemoveGreyTotal).length

    const biggyArgsTo = biggyArgs.to > blueProductsLength ? blueProductsLength - 1 : biggyArgs.to
    const resultToRemoveGrey = await intelligentSearchApi.productSearch({...biggyArgs, to: biggyArgsTo}, buildAttributePath(selectedFacets))

    const newProducts = removeGreyProducts(resultToRemoveGrey)

    const resultAux = {...result,
      recordsFiltered: blueProductsLength,
      products: newProducts,
    }
    //console.log('resultAux', resultAux)
    if (ctx.vtex.tenant && !args.productOriginVtex) {
      ctx.translated = result.translated
    }

    return {
      searchState: args.searchState,
      ...resultAux
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
      const { maps, queries } = args.selectedFacets.reduce(
        (acc, { key, value }) => {
          if (key !== 'region-id') {
            acc.maps.push(key)
            acc.queries.push(value)
          }

          return acc
        },
        { maps: [] as string[], queries: [] as string[]}
      )
      const map = maps.join(',')
      const query = queries.join('/')

      args.map = map
      args.query = args.query || query || undefined
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
    const { intelligentSearchApi } = ctx.clients
    return await intelligentSearchApi.topSearches()
  },
  autocompleteSearchSuggestions: (
    _: any,
    args: { fullText: string },
    ctx: Context
  ) => {
    const { intelligentSearchApi } = ctx.clients

    return intelligentSearchApi.autocompleteSearchSuggestions({
      query: args.fullText,
      ...args
    })
  },
  productSuggestions: async (
    _: any,
    args: SuggestionProductsArgs,
    ctx: Context
  ) => {
    const {
      clients: { intelligentSearchApi },
    } = ctx

    const workspaceSearchParams = await getWorkspaceSearchParamsFromStorage(ctx)
    const selectedFacets: SelectedFacet[] = args.facetKey && args.facetValue ? [{key: args.facetKey, value: args.facetValue}] : []

    const biggyArgs : {[key: string] : any} = {
      ...args,
      query: args.fullText,
      from: 0,
      to: 4,
      ...workspaceSearchParams,
      sort: convertOrderBy(args.orderBy),
    }

    // unnecessary field. It's is an object and breaks the @vtex/api cache
    delete biggyArgs.selectedFacets

    const result = await intelligentSearchApi.productSearch(biggyArgs, buildAttributePath(selectedFacets))
    console.log('productSuggestions result', result)
    if (ctx.vtex.tenant && !args.productOriginVtex) {
      ctx.translated = result.translated
    }

    console.log('productSuggestions products.length', result.products.length)
    const newProducts = removeGreyProducts(result)
    const resultAux = {...result,
      recordsFiltered: newProducts.length,
      products: newProducts,
    }
    // console.log('resultAux', resultAux)

    return {
      ...resultAux,
      count: resultAux.recordsFiltered
    }
  },
  banners: (
    _: any,
    args: { fullText: string; selectedFacets: SelectedFacet[] },
    ctx: Context
  ) => {
    const { intelligentSearchApi } = ctx.clients

    return intelligentSearchApi.banners({
      query: args.fullText,
    }, buildAttributePath(args.selectedFacets))
  },
  correction: (_: any, args: { fullText: string }, ctx: Context) => {
    const { intelligentSearchApi } = ctx.clients

    return intelligentSearchApi.correction({
      query: args.fullText,
      ...args
    })
  },
  searchSuggestions: (_: any, args: { fullText: string }, ctx: Context) => {
    const { intelligentSearchApi } = ctx.clients

    return intelligentSearchApi.searchSuggestions({query: args.fullText})
  },
}
function removeGreyProducts(result: any) {
  const newProducts: any[] = []

  result?.products?.forEach((p: any) => {
    //console.log('p', p)
    const items = p.items
    let available = false
    items.forEach((i: any) => {
      const sellers = i.sellers
      sellers.forEach((s: any) => {
        const quantity = s.commertialOffer.AvailableQuantity
        /*console.log('item', i.name)
        console.log('seller.sellerId', s.sellerId)
        console.log('seller.sellerName', s.sellerName)
        console.log('quantity', quantity)*/
        if (!available && quantity > 0) {
          available = true
        }
        /*console.log('available', available)
        console.log('-----------')*/
      })
    })
    if (available) {
      newProducts.push(p)
    }
  })
  return newProducts
}

function removeBlueProducts (result: any){
  const newProducts: any[] = []

  result?.products?.forEach((p: any) => {
    //console.log('p', p)
    const items = p.items
    let available = false
    items.forEach((i: any) => {
      const sellers = i.sellers
      sellers.forEach((s: any) => {
        const quantity = s.commertialOffer.AvailableQuantity
        if (!available && quantity > 0) {
          available = true
        }
      })
    })
    if (!available) {
      newProducts.push(p)
    }
  })
  return newProducts
}
