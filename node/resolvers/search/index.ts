import { NotFoundError, UserInputError, createMessagesLoader } from '@vtex/api'
import { head, isEmpty, isNil, test, pathOr, path } from 'ramda'

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
import { resolvers as productPriceRangeResolvers } from './productPriceRange'
import { getSearchMetaData } from './modules/metadata'
import {
  SearchCrossSellingTypes,
  getMapAndPriceRangeFromSelectedFacets,
} from './utils'
import { toCompatibilityArgs } from './newURLs'
import { PATH_SEPARATOR, MAP_VALUES_SEP } from './constants'
import {
  buildAttributePath,
  convertOrderBy,
  buildBreadcrumb,
} from '../../commons/compatibility-layer'
import { productsCatalog, productsBiggy } from '../../commons/products'
import { attributesToFilters } from '../../utils/attributes'

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
  values: string[]
}

const inputToSearchCrossSelling = {
  [CrossSellingInput.buy]: SearchCrossSellingTypes.whoboughtalsobought,
  [CrossSellingInput.view]: SearchCrossSellingTypes.whosawalsosaw,
  [CrossSellingInput.similars]: SearchCrossSellingTypes.similars,
  [CrossSellingInput.viewAndBought]: SearchCrossSellingTypes.whosawalsobought,
  [CrossSellingInput.accessories]: SearchCrossSellingTypes.accessories,
  [CrossSellingInput.suggestions]: SearchCrossSellingTypes.suggestions,
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

  if (!from || from === to) {
    return term
  }

  if (!state.messages) {
    state.messages = createMessagesLoader(clients, to)
  }

  return state.messages!.load({
    from,
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

    const { biggySearch } = ctx.clients
    const { segment } = ctx.vtex

    const biggyArgs = {
      searchState,
      query: fullText,
      attributePath: buildAttributePath(args.selectedFacets),
      tradePolicy: segment && segment.channel,
    }

    const result = await biggySearch.facets(biggyArgs)

    return {
      facets: attributesToFilters(result),
      queryArgs: {
        query: args.query,
        selectedFacets: args.selectedFacets,
      },
      breadcrumb: buildBreadcrumb(
        result.attributes || [],
        args.fullText,
        args.selectedFacets || []
      ),
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
        products = await search.productBySku([value])
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
    const { field, values } = args

    switch (field) {
      case 'id':
        products = await search.productsById(values)
        break
      case 'ean':
        products = await search.productsByEan(values)
        break
      case 'reference':
        products = await search.productsByReference(values)
        break
      case 'sku':
        products = await search.productBySku(values)
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

    const { biggySearch } = ctx.clients
    const { segment } = ctx.vtex
    const {
      from,
      to,
      selectedFacets,
      fullText,
      fuzzy,
      operator,
      searchState,
    } = args

    const count = to - from + 1
    const page = Math.round((to + 1) / count)

    const biggyArgs = {
      page,
      count,
      fuzzy,
      operator,
      searchState,
      attributePath: buildAttributePath(selectedFacets),
      query: fullText,
      tradePolicy: segment && segment.channel,
      sort: convertOrderBy(args.orderBy),
    }

    const result = await biggySearch.productSearch(biggyArgs)

    const productResolver = args.productOriginVtex
      ? productsCatalog
      : productsBiggy
    const convertedProducts = productResolver(result, ctx)

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

    const query = await translateToStoreDefaultLanguage(ctx, args.query || '')
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
    const { biggySearch } = ctx.clients

    const tradePolicy = path<string | undefined>(['segment', 'channel'], args)

    const result = await biggySearch.suggestionProducts({
      ...args,
      tradePolicy,
    })

    return result
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
