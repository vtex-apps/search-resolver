import { ExternalClient, InstanceOptions, IOContext } from "@vtex/api";
import { parseState } from "../utils/searchState";
import { createAuction } from "@topsort/sdk";

const isPathTraversal = (str: string) => str.indexOf('..') >= 0
interface CorrectionParams {
  query: string
}

interface SearchSuggestionsParams {
  query: string
}

interface AutocompleteSearchSuggestionsParams {
  query: string
}

interface BannersArgs {
  query: string
}

interface FacetsArgs {
  query?: string
  page?: number
  count?: number
  sort?: string
  operator?: string
  fuzzy?: string
  leap?: boolean
  tradePolicy?: number
  searchState?: string
  hideUnavailableItems?: boolean | null
  removeHiddenFacets?: boolean | null
  options?: Options
  initialAttributes?: string
  workspaceSearchParams?: object
  regionId?: string | null
}

const decodeQuery = (query: string) => {
  try {
    return decodeURIComponent(query)
  } catch (e) {
    return query
  }
}

export class IntelligentSearchApi extends ExternalClient {
  private locale: string | undefined

  public constructor(context: IOContext, options?: InstanceOptions) {
    super(`http://${context.workspace}--${context.account}.myvtex.com/_v/api/intelligent-search`, context, {
      ...options,
      headers: {
        ...options?.headers,
      }
    })

    const { locale, tenant } = context
    this.locale = locale ?? tenant?.locale
  }

  public async topSearches() {
    return this.http.get('/top_searches', {
params: {
        locale: this.locale
      }, metric: 'topSearches'
})
  }

  public async correction(params: CorrectionParams) {
    return this.http.get('/correction_search', { params: { ...params, locale: this.locale }, metric: 'correction' })
  }

  public async searchSuggestions(params: SearchSuggestionsParams) {
    return this.http.get('/search_suggestions', { params: { ...params, locale: this.locale }, metric: 'searchSuggestions' })
  }

  public async autocompleteSearchSuggestions(params: AutocompleteSearchSuggestionsParams) {
    return this.http.get('/autocomplete_suggestions', { params: { ...params, locale: this.locale }, metric: 'autocompleteSearchSuggestions' })
  }

  public async banners(params: BannersArgs, path: string) {
    if (isPathTraversal(path)) {
      throw new Error("Malformed URL")
    }

    return this.http.get(`/banners/${path}`, { params: { ...params, query: params.query, locale: this.locale }, metric: 'banners' })
  }

  public async facets(params: FacetsArgs, path: string, shippingHeader?: string[]) {
    if (isPathTraversal(path)) {
      throw new Error("Malformed URL")
    }

    const { query, leap, searchState } = params

    return this.http.get(`/facets/${path}`, {
      params: {
        ...params,
        query: query && decodeQuery(query),
        locale: this.locale,
        bgy_leap: leap ? true : undefined,
        ...parseState(searchState),
      },
      metric: 'facets',
      headers: {
        'x-vtex-shipping-options': shippingHeader ?? '',
      },
    })
  }

  public async productSearch(params: SearchResultArgs, path: string, shippingHeader?: string[]) {
    const { query, leap, searchState } = params
    if (isPathTraversal(path)) {
      throw new Error("Malformed URL")
    }

    return this.http.get(`/product_search/${path}`, {
      params: {
        query: query && decodeQuery(query),
        locale: this.locale,
        bgy_leap: leap ? true : undefined,
        ...parseState(searchState),
        ...params,
      },
      metric: 'product-search',
      headers: {
        'x-vtex-shipping-options': shippingHeader ?? '',
      },
    })
  }

  public async sponsoredProducts(params: SearchResultArgs, path: string, shippingHeader?: string[]) {
    const result = await this.productSearch(params, path, shippingHeader)
    const productIds = result.products.map((product: any) => product.productId);
    // TODO: set the api key on vtex admin page
    const apiKey = process.env.TOPSORT_API_KEY;
    const auction = {
      auctions: [
        {
          products: {
            ids: productIds,
          },
          type: "listings",
          // TODO: Set number of slots in params
          slots: 2,
        }
      ]
    };
    try {
      const auctionResult = await createAuction({ apiKey }, auction);
      const sponsoredProducts = auctionResult.auctions[0].winners.map((winner: any) => {
        const product = result.products.find((product: any) => product.productId === winner.productId);
        return {
          ...product,
          sponsored: true,
          topsort: {
            resolvedBidId: winner.resolvedBidId,
          }
        }
      });
      for (const product of sponsoredProducts.reverse()) {
        result.products.unshift(product);
      }
    } catch(err) {
      this.context.logger.warn({ service: "IntelligentSearchApi", error: err.message, errorStack: err });
    }
    return result;
  }
}
