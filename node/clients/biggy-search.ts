import { InstanceOptions, IOContext, JanusClient } from '@vtex/api'
import { IndexingType } from '../commons/compatibility-layer'
import { parseState } from '../utils/searchState'
import path from 'path'

const isLinked = process.env.VTEX_APP_LINK

// O(n) product sort
const countingSort = (products: {id: string}[], order: string[]) => {
  const sortedProducts = new Array(order.length)
  const orderMap = order.reduce(
    (acc, id, index) => {
      acc.set(id, index)
      return acc
    },
    new Map<string, number>()
  )

  for (const product of products) {
    const index = orderMap.get(product.id)

    if (index === undefined) {
      continue
    }

    sortedProducts[index] = product
  }

  return sortedProducts
}

const validNavigationPage = (attributePath: string, query?: string) => {
  if (query) {
    return false
  }
  return attributePath.split('/').filter(value => value).length % 2 === 0
}

const decodeQuery = (query: string) => {
  try {
    return decodeURIComponent(query)
  } catch (e) {
    return query
  }
}

const isProductQuery = /^product:(([0-9])+;)+([0-9])+$/g
const sortProducts = (search: { total: number, products: {id: string}[]}, query: string | undefined) => {
  if (typeof query === 'string' && isProductQuery.test(query) && search.total > 0) {
    const order = query.replace('product:', '').split(';')

    if (order.length === search.total) {
      search.products = countingSort(search.products, order)
    }
  }

  return search
}

const buildPathFromArgs = (args: SearchResultArgs) => {
  const { attributePath, tradePolicy, indexingType } = args

  // On headless stores, the trade-policy is already present in the selectedFacets, so there is no need to add it again.
  const alreadyHasTradePolicy =  /(\/|^)trade-policy\//.test(attributePath)

  const policyAttr =
    tradePolicy && indexingType !== IndexingType.XML && !alreadyHasTradePolicy
      ? `trade-policy/${tradePolicy}`
      : ''

  return path.join(attributePath.split('%20').join('-'), policyAttr)
}

const buildBSearchFilterHeader = (sellers?: RegionSeller[]) =>
  !sellers || sellers.length === 0
    ? ''
    : sellers.reduce((cookie: string, seller: RegionSeller, idx: number) => {
        return `${cookie}${idx > 0 ? '/' : ''}${seller.id}`
      }, 'private-seller#')

export class BiggySearchClient extends JanusClient {
  private store: string
  private locale: string | undefined

  public constructor(context: IOContext, options?: InstanceOptions) {
    super(context, {...options})

    const { account, locale, tenant } = context
    this.store = account
    this.locale = locale ?? tenant?.locale
  }

  public async topSearches(): Promise<any> {
    const result = await this.http.get(`/search-api/v1/${this.store}/api/top_searches`, {
      metric: 'top-searches',
      forceMaxAge: 3600,
      params: {
        locale: this.locale,
      }
    })

    return result
  }

  public async suggestionSearches(args: SuggestionSearchesArgs): Promise<any> {
    const { term } = args

    const result = await this.http.get(
      `/search-api/v1/${this.store}/api/suggestion_searches`,
      {
        params: {
          term: decodeURIComponent(term),
          locale: this.locale,
        },
        metric: 'suggestion-searches',
      }
    )

    return result
  }

  public async suggestionProducts(args: SuggestionProductsArgs & { sellers: RegionSeller[] }): Promise<any> {
    const {
      fullText: term,
      facetKey: attributeKey,
      facetValue: attributeValue,
      salesChannel: tradePolicy,
      indexingType,
      sellers,
      hideUnavailableItems = false,
      workspaceSearchParams,
      segmentedFacets,
    } = args
    const attributes: { key: string; value: string }[] = []

    if (attributeKey && attributeValue) {
      attributes.push({
        key: attributeKey,
        value: attributeValue,
      })
    }

    if (segmentedFacets) {
      segmentedFacets.forEach(({key, value}) => {
        attributes.push({
          key,
          value,
        })
      })
    }

    if (indexingType !== IndexingType.XML && tradePolicy) {
      attributes.push({
        key: 'trade-policy',
        value: tradePolicy.toString(),
      })
    }

    const result = await this.http.post(
      `/search-api/v1/${this.store}/api/suggestion_products`,
      {
        term: decodeURIComponent(term),
        attributes,
      },
      {
        metric: 'suggestion-products',
        params: {
          locale: this.locale,
          ['hide-unavailable-items']: hideUnavailableItems ?? false,
          ...workspaceSearchParams
        },
        headers: {
          "X-VTEX-IS-Filter": buildBSearchFilterHeader(sellers),
          "X-VTEX-IS-ID": `${this.store}`,
        },
      }
    )

    return result
  }

  public async searchMetadata(args: SearchResultArgs): Promise<any> {
    const {
      query,
      page,
      count,
      sort,
      operator,
      fuzzy,
      leap,
      searchState,
    } = args

    const url = `/search-api/v1/${this.store}/api/io/split/metadata_search/${buildPathFromArgs(
      args
    )}`

    const result = await this.http.getRaw(url, {
      params: {
        query: decodeURIComponent(query ?? ''),
        page,
        count,
        sort,
        operator,
        fuzzy,
        locale: this.locale,
        bgy_leap: leap ? true : undefined,
        ...parseState(searchState),
      },
      metric: 'search-result',
    })

    const { title, description: metaTagDescription } = result.data

    return {
      title,
      metaTagDescription,
    }
  }

  public async facets(args: SearchResultArgs): Promise<any> {
    const {
      query,
      page,
      count,
      sort,
      operator,
      fuzzy,
      leap,
      searchState,
      sellers,
      hideUnavailableItems,
      initialAttributes,
      regionId,
    } = args

    const cache = validNavigationPage(args.attributePath, query) ? { forceMaxAge: 3600 } : {}
    const url = `/search-api/v1/${this.store}/api/io/split/attribute_search/${buildPathFromArgs(
      args
    )}`

    const result = await this.http.getRaw(url, {
      params: {
        query: decodeQuery(query ?? ''),
        page,
        count,
        sort,
        operator,
        fuzzy,
        locale: this.locale,
        bgy_leap: leap ? true : undefined,
        initialAttributes,
        regionId,
        ['hide-unavailable-items']: hideUnavailableItems ? 'true' : 'false',
        ...parseState(searchState),
      },
      metric: 'search-result',
      headers: {
        "X-VTEX-IS-Filter": buildBSearchFilterHeader(sellers),
        "X-VTEX-IS-ID": `${this.store}`,
      },
      ...cache,
    })

    return result.data
  }

  public async productSearch(args: SearchResultArgs): Promise<any> {
    const {
      query,
      page,
      count,
      sort,
      operator,
      fuzzy,
      leap,
      searchState,
      sellers,
      hideUnavailableItems,
      options,
      workspaceSearchParams,
      regionId,
    } = args

    const cache = validNavigationPage(args.attributePath, query) ? { forceMaxAge: 3600 } : {}
    const url = `/search-api/v1/${this.store}/api/io/split/product_search/${buildPathFromArgs(
      args
    )}`

    const params = {
      query: decodeQuery(query ?? ''),
      page,
      count,
      sort,
      operator,
      fuzzy,
      locale: this.locale,
      bgy_leap: leap ? true : undefined,
      allowRedirect: options?.allowRedirect === false ? false : true,
      regionId,
      ['hide-unavailable-items']: hideUnavailableItems ? 'true' : 'false',
      ...parseState(searchState),
      ...workspaceSearchParams, // important that this be last so that it can override master settings above
    }

    if (isLinked) {
      // eslint-disable-next-line no-console
      console.log({
        productSearch: {
          url,
          ...params,
          "X-VTEX-IS-Filter": buildBSearchFilterHeader(sellers),
          ...cache,
        }
      })
    }

    const result = await this.http.getRaw(url, {
      params,
      metric: 'search-result',
      headers: {
        "X-VTEX-IS-Filter": buildBSearchFilterHeader(sellers),
        "X-VTEX-IS-ID": `${this.store}`,
      },
      ...cache
    })

    if (!result.data?.total) {
      this.context.logger.warn({
        message: 'Empty search',
        url,
        params,
      })
    }

    return sortProducts(result.data, query)
  }

  public async banners(args: SearchResultArgs): Promise<any> {
    const { fullText } = args

    const url = `/search-api/v1/${this.store}/api/io/split/banner_search/${buildPathFromArgs(
      args
    )}`

    const result = await this.http.getRaw(url, {
      params: {
        query: decodeURIComponent(fullText),
        locale: this.locale,
      },
      metric: 'search-result',
    })

    return {
      banners: result.data.banners,
    }
  }

  public async autocompleteSearchSuggestions(args: {
    fullText: string
  }): Promise<any> {
    const { fullText } = args

    const result = await this.http.get(
      `/search-api/v1/${this.store}/api/suggestion_searches`,
      {
        params: {
          term: decodeURIComponent(fullText),
          locale: this.locale,
        },
        metric: 'search-autocomplete-suggestions',
      }
    )

    return result
  }

  public async correction(args: { fullText: string }): Promise<any> {
    const { fullText } = args

    const url = `/search-api/v1/${this.store}/api/io/split/correction_search/`

    const result = await this.http.getRaw(url, {
      params: {
        query: decodeURIComponent(fullText),
        locale: this.locale,
      },
      metric: 'search-correction',
    })

    return {
      correction: result.data.correction,
    }
  }

  public async searchSuggestions(args: { fullText: string }): Promise<any> {
    const { fullText } = args

    const url = `/search-api/v1/${this.store}/api/io/split/suggestion_search/`

    const result = await this.http.getRaw(url, {
      params: {
        query: decodeURIComponent(fullText),
        locale: this.locale,
      },
      metric: 'search-suggestions',
    })

    return result.data.suggestion
  }
}
