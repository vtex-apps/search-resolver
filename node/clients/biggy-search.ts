import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'
import { IndexingType } from '../commons/compatibility-layer'
import { parseState } from '../utils/searchState'
import path from 'path'
// import atob from 'atob'

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

const buildBSearchFilterCookie = (sellers?: RegionSeller[]) => {

  console.log("---------------------- clients/biggy-search.ts --------------------------")
  // let newRegionId = "", encodedNewRegionId = ""
  // console.log(regionId)

  // if (atob(regionId ? regionId : "").indexOf("SW#poccarrefourarg0206") == -1 ){
  //   newRegionId = "SW#poccarrefourarg0206;" + atob(regionId ? regionId : "")
  //   let buff = new Buffer(newRegionId)
  //   encodedNewRegionId = buff.toString('base64')
  // }
  console.log("---------------------- clients/biggy-search.ts --------------------------")
  // console.log(encodedNewRegionId)
  let vtexSegmentCookieObject = {
      "campaigns": null,
      "channel": "1",
      "priceTables": null,
      "regionId": 'U1cjcG9jY2FycmVmb3VyYXJnMDIwNjtTVyNwb2NjYXJyZWZvdXJhcmcwMDAy',
      "utm_campaign": null,
      "utm_source": null,
      "utmi_campaign": null,
      "currencyCode": "ARS",
      "currencySymbol": "$",
      "countryCode": "ARG",
      "cultureInfo": "es-AR",
      "admin_cultureInfo": "es-AR",
      "channelPrivacy": "public"
    }
  let vtexSegmentCookie = JSON.stringify(vtexSegmentCookieObject)
  let buff2 = new Buffer(vtexSegmentCookie)
  let encodedVtexSegmentCookie = buff2.toString('base64')

  console.log("---------------------- clients/search.ts --------------------------")
  console.log("inside cookie generator")
  console.log(vtexSegmentCookie)
  console.log(encodedVtexSegmentCookie)
  console.log(sellers)

  // return "vtex_segment=" + encodedVtexSegmentCookie

  let aux = !sellers || sellers.length === 0
  ? ''
  : sellers.reduce((cookie: string, seller: RegionSeller, idx: number) => {
      return `${cookie}${idx > 0 ? '/' : ''}${seller.id}`
    }, 'bsearch-filter=private-seller#')// + ";vtex_segment=" + encodedVtexSegmentCookie

  console.log({aux})

  return aux// "bsearch-filter=private-seller#poccarrefourarg0206/poccarrefourarg0002"
}

export class BiggySearchClient extends ExternalClient {
  private store: string
  private locale: string | undefined

  public constructor(context: IOContext, options?: InstanceOptions) {
    super('http://search.biggylabs.com.br/search-api/v1/', context, options)

    const { account, locale, tenant } = context
    this.store = account
    this.locale = locale ?? tenant?.locale
  }

  public async topSearches(): Promise<any> {
    const result = await this.http.get(`${this.store}/api/top_searches`, {
      metric: 'top-searches',
      params: {
        locale: this.locale,
      }
    })

    return result
  }

  public async suggestionSearches(args: SuggestionSearchesArgs): Promise<any> {
    const { term } = args

    console.log('----------8-----------')

    const result = await this.http.get(
      `${this.store}/api/suggestion_searches`,
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

  public async suggestionProducts(args: SuggestionProductsArgs): Promise<any> {
    let {
      fullText: term,
      facetKey: attributeKey,
      facetValue: attributeValue,
      salesChannel: tradePolicy,
      indexingType,
      sellers,
      hideUnavailableItems = false
    } = args

    console.log('----------7------------')

    // sellers = [
    //   {
    //     id: 'poccarrefourarg0002',
    //     name: 'Tienda Vicente Lopez'
    //   },
    //   {
    //     id: 'poccarrefourarg0206',
    //     name: 'poccarrefourarg0206'
    //   }
    // ]
    const attributes: { key: string; value: string }[] = []

    if (attributeKey && attributeValue) {
      attributes.push({
        key: attributeKey,
        value: attributeValue,
      })
    }

    if (indexingType !== IndexingType.XML && tradePolicy) {
      attributes.push({
        key: 'trade-policy',
        value: tradePolicy.toString(),
      })
    }

    const result = await this.http.post(
      `${this.store}/api/suggestion_products`,
      {
        term: decodeURIComponent(term),
        attributes,
      },
      {
        metric: 'suggestion-products',
        params: {
          locale: this.locale,
          ['hide-unavailable-items']: hideUnavailableItems ?? false,
        },
        headers: {
          Cookie: buildBSearchFilterCookie(sellers),
          "X-VTEX-IS-ID": `${this.store}`,
        },
      }
    )

    console.log('----------3------------')
    console.log(result)

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

    const url = `${this.store}/api/split/metadata_search/${buildPathFromArgs(
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
    let {
      query,
      page,
      count,
      sort,
      operator,
      fuzzy,
      leap,
      searchState,
      sellers,
      hideUnavailableItems
    } = args

    // sellers = [
    //   {
    //     id: 'poccarrefourarg0002',
    //     name: 'Tienda Vicente Lopez'
    //   },
    //   {
    //     id: 'poccarrefourarg0206',
    //     name: 'poccarrefourarg0206'
    //   }
    // ]

    const url = `${this.store}/api/split/attribute_search/${buildPathFromArgs(
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
        ['hide-unavailable-items']: hideUnavailableItems ? 'true' : 'false',
        ...parseState(searchState),
      },
      metric: 'search-result',
      headers: {
        Cookie: buildBSearchFilterCookie(sellers),
        "X-VTEX-IS-ID": `${this.store}`,
      },
    })

    return result.data
  }

  public async productSearch(args: SearchResultArgs): Promise<any> {
    let {
      query,
      page,
      count,
      sort,
      operator,
      fuzzy,
      leap,
      searchState,
      sellers,
      hideUnavailableItems
    } = args

    // sellers = [
    //   {
    //     id: 'poccarrefourarg0002',
    //     name: 'Tienda Vicente Lopez'
    //   },
    //   {
    //     id: 'poccarrefourarg0206',
    //     name: 'poccarrefourarg0206'
    //   }
    // ]

    console.log("productSearch")

    const url = `${this.store}/api/split/product_search/${buildPathFromArgs(
      args
    )}`

    if (isLinked) {
      // eslint-disable-next-line no-console
      console.log({
        productSearch: {
          url,
          query: decodeURIComponent(query ?? ''),
          page,
          count,
          sort,
          operator,
          fuzzy,
          locale: this.locale,
          bgy_leap: leap ? true : undefined,
          ['hide-unavailable-items']: hideUnavailableItems ? 'true' : 'false',
          ...parseState(searchState),
          cookie: buildBSearchFilterCookie(sellers)
        }
      })
    }

    console.log({url})
    console.log({query})
    console.log({page})
    console.log({count})
    console.log({sort})
    console.log({operator})
    console.log({fuzzy})
    console.log(this.locale)
    console.log({leap})
    console.log({hideUnavailableItems})
    console.log({hideUnavailableItems})
    console.log({...parseState(searchState)})

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
        ['hide-unavailable-items']: hideUnavailableItems ? 'true' : 'false',
        ...parseState(searchState),
      },
      metric: 'search-result',
      headers: {
        Cookie: buildBSearchFilterCookie(sellers),
        "X-VTEX-IS-ID": `${this.store}`,
      },
    })

    // const result2 = await this.http.getRaw(
    //   'https://poccarrefourarg.vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=productId:123456900',
    //   {
    //   metric: 'search-result',
    //   headers: {
    //     Cookie: buildBSearchFilterCookie(sellers),
    //     "X-VTEX-IS-ID": `${this.store}`,
    //   },
    // })

    // console.log(result.data)
    // console.log(result2.data)

    return sortProducts(result.data, query)
  }

  public async banners(args: SearchResultArgs): Promise<any> {
    const { fullText } = args

    const url = `${this.store}/api/split/banner_search/${buildPathFromArgs(
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
      `${this.store}/api/suggestion_searches`,
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

    const url = `${this.store}/api/split/correction_search/`

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

    const url = `${this.store}/api/split/suggestion_search/`

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
