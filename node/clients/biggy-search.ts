import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'
import { IndexingType } from '../commons/compatibility-layer'
import { parseState } from '../utils/searchState'
import path from 'path'

const buildPathFromArgs = (args: SearchResultArgs) => {
  const { attributePath, tradePolicy, indexingType } = args

  const policyAttr =
    tradePolicy && indexingType !== IndexingType.XML
      ? `trade-policy/${tradePolicy}`
      : ''

  return path.join(attributePath.split('%20').join('-'), policyAttr)
}

export class BiggySearchClient extends ExternalClient {
  private store: string

  public constructor(context: IOContext, options?: InstanceOptions) {
    super('http://search.biggylabs.com.br/search-api/v1/', context, options)

    const { account } = context
    this.store = account
  }

  public async topSearches(): Promise<any> {
    const result = await this.http.get(`${this.store}/api/top_searches`, {
      metric: 'top-searches',
    })

    return result
  }

  public async suggestionSearches(args: SuggestionSearchesArgs): Promise<any> {
    const { term } = args

    const result = await this.http.get(
      `${this.store}/api/suggestion_searches`,
      {
        params: {
          term: decodeURIComponent(term),
        },
        metric: 'suggestion-searches',
      }
    )

    return result
  }

  public async suggestionProducts(args: SuggestionProductsArgs): Promise<any> {
    const {
      fullText: term,
      facetKey: attributeKey,
      facetValue: attributeValue,
      tradePolicy,
      indexingType,
    } = args
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
        value: tradePolicy,
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

    const url = `${this.store}/api/split/metadata_search/${buildPathFromArgs(
      args
    )}`

    const result = await this.http.getRaw(url, {
      params: {
        query: decodeURIComponent(query || ''),
        page,
        count,
        sort,
        operator,
        fuzzy,
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
    } = args

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
        bgy_leap: leap ? true : undefined,
        ...parseState(searchState),
      },
      metric: 'search-result',
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
    } = args

    const url = `${this.store}/api/split/product_search/${buildPathFromArgs(
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
        bgy_leap: leap ? true : undefined,
        ...parseState(searchState),
      },
      metric: 'search-result',
    })

    return result.data
  }

  public async banners(args: SearchResultArgs): Promise<any> {
    const { fullText } = args

    const url = `${this.store}/api/split/banner_search/${buildPathFromArgs(
      args
    )}`

    const result = await this.http.getRaw(url, {
      params: {
        query: decodeURIComponent(fullText),
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
        },
        metric: 'search-autcomplete-suggestions',
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
      },
      metric: 'search-suggestions',
    })

    return result.data.suggestion
  }
}
