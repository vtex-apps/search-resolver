/* eslint-disable no-console */
import {
  ExternalClient,
  RequestConfig,
} from '@vtex/api'
import type { InstanceOptions, IOContext } from '@vtex/api'

import { stringify } from 'qs'
import algoliasearch from 'algoliasearch'

import {ENVIRONMENT as settings} from '../constants'
import { productSuggestions as productSuggestionsMapping } from '../utils/productMapping'
import {
  searchEncodeURI,
} from '../resolvers/search/utils'


interface AutocompleteArgs {
  maxRows: number | string;
  searchTerm: string;
}

interface SearchAutocompleteItem {
  productId: string
  itemId: string
  name: string
  nameComplete: string
  imageUrl: string
}

interface SearchAutocompleteUnit {
  items: SearchAutocompleteItem[]
  thumb: string
  thumbUrl: string | null
  name: string
  href: string
  criteria: string
}
enum SimulationBehavior {
  SKIP = 'skip',
  DEFAULT = 'default',
}

const inflightKey = ({ baseURL, url, params, headers }: RequestConfig) => {
  return (
    baseURL! +
    url! +
    stringify(params, { arrayFormat: 'repeat', addQueryPrefix: true }) +
    `&segmentToken=${headers['x-vtex-segment']}`
  )
}

/** Search API
 * Docs: https://documenter.getpostman.com/view/845/catalogsystem-102/Hs44
 */
export class Algolia extends ExternalClient {
  private searchEncodeURI: (x: string) => string
  private index: any
  private updateIndex: any
  private virtualReplicaASC: any
  private virtualReplicaDESC: any

  private addCompleteSpecifications = (url: string) => {
    if (!url.includes('?')) {
      return `${url}?compSpecs=true`
    }

    return `${url}&compSpecs=true`
  }

  public constructor(ctx: IOContext, opts?: InstanceOptions) {
    super(``, ctx, opts)
    const client = algoliasearch(settings.algolia.appId, settings.algolia.searchKey, {
      headers: {
        'x-vtex-use-https': 'true',
        'Proxy-Authorization': ctx.authToken,
      },
      hosts: [{
        url: `TDB6H926RQ-dsn.algolia.net`,
        protocol: 'http'
      }]
    })
    this.index = client.initIndex(settings.algolia.indexKey)

    const updateClient = algoliasearch(settings.algolia.appId, settings.algolia.adminKey, {
      headers: {
        'x-vtex-use-https': 'true',
        'Proxy-Authorization': ctx.authToken,
      },
      hosts: [{
        url: `TDB6H926RQ-dsn.algolia.net`,
        protocol: 'http'
      }]
    })
    this.updateIndex = updateClient.initIndex(settings.algolia.updateKey)

    this.virtualReplicaASC = client.initIndex(settings.algolia.indexKey+'_asc')

    this.virtualReplicaDESC = client.initIndex(settings.algolia.indexKey+'_desc')

    this.searchEncodeURI = searchEncodeURI(ctx.account)
  }

  public search = async (term: string, args: any = {}) => {
    const parsedArgs = {
      offset: args.offset ?? undefined,
      length: args.length ?? undefined,
      facets: args.facets ?? undefined,
      filters: args.filters ?? undefined,
    }

    console.log('### Algolia search client => ', parsedArgs)

    if (args.sort && args.sort !== 'OrderByScoreDESC') {
      if(args.sort === 'OrderByNameASC') {
        return this.virtualReplicaASC.search(term, parsedArgs)
      } else {
        return this.virtualReplicaDESC.search(term, parsedArgs)
      }
    }
    return this.index.search(term, parsedArgs)
  }
  public saveObject = async (args: any) => await this.updateIndex.saveObject(args)

  public productsQuantity = async (args: SearchArgs) => {
    const {
      headers: { resources },
    } = await this.getRaw(this.productSearchUrl(args))
    const quantity = resources.split('/')[1]
    return parseInt(quantity, 10)
  }

  public autocomplete = async ({ maxRows, searchTerm }: AutocompleteArgs): Promise<{ cacheId: null, itemsReturned: SearchAutocompleteUnit[] }> => {
    const response: any = await this.index.search(searchTerm, {length: maxRows});

    const itemsReturned = response?.hits?.map(({
      slug,
      product_id,
      name,
      image_urls,
      criteria
    }: any) => {

      return {
        thumb: image_urls[0] ?? '',
        name: name ?? '',
        href: slug ?? '',
        slug: slug?.replace(/\/p|\//g,'') ?? '',
        productId: String(product_id) ?? '',
        criteria: criteria ?? '',
      }
    }) || [];


    return { cacheId: null, itemsReturned };
  }


  public productSuggestions = async (translatedTerm: string, args: any) => {
    const ret = await this.index.search(translatedTerm, args)
    const productsMap = productSuggestionsMapping(ret?.hits)


    return {
      count: ret?.nbHits ?? 0,
      misspelled: null,
      operator: null,
      products: productsMap ?? []
    }
  }


  private getRaw = <T = any>(url: string, config: RequestConfig = {}) => {

    config.inflightKey = inflightKey

    return this.http.getRaw<T>(`/${url}`, config)
  }

  private productSearchUrl = ({
    query = '',
    fullText = '',
    category = '',
    specificationFilters,
    priceRange = '',
    collection = '',
    salesChannel = '',
    orderBy = '',
    from = 0,
    to = 9,
    map = '',
    hideUnavailableItems = false,
    simulationBehavior = SimulationBehavior.DEFAULT,
    completeSpecifications = true,
  }: SearchArgs) => {
    const sanitizedQuery = encodeURIComponent(
      this.searchEncodeURI(decodeURIComponent(query || fullText || '').trim())
    )
    if (hideUnavailableItems) {
      const segmentData = (this.context as CustomIOContext).segment
      salesChannel = (segmentData && segmentData.channel.toString()) || ''
    }
    let url = `/pub/products/search/${sanitizedQuery}?`
    if (category && !query) {
      url += `&fq=C:/${category}/`
    }
    if (specificationFilters && specificationFilters.length > 0) {
      url += specificationFilters.map(filter => `&fq=${filter}`)
    }
    if (priceRange) {
      url += `&fq=P:[${priceRange}]`
    }
    if (collection) {
      url += `&fq=productClusterIds:${collection}`
    }
    if (salesChannel) {
      url += `&fq=isAvailablePerSalesChannel_${salesChannel}:1`
    }
    if (orderBy) {
      url += `&O=${orderBy}`
    }
    if (map) {
      url += `&map=${map}`
    }
    if (from != null && from > -1) {
      url += `&_from=${from}`
    }
    if (to != null && to > -1) {
      url += `&_to=${to}`
    }
    if (simulationBehavior === SimulationBehavior.SKIP) {
      url += `&simulation=false`
    }
    if (completeSpecifications) {
      url = this.addCompleteSpecifications(url)
    }
    return url
  }
}
