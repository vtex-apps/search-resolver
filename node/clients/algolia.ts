import {
  ExternalClient,
} from '@vtex/api'
import type { InstanceOptions, IOContext } from '@vtex/api'

import algoliasearch from 'algoliasearch'

import {ENVIRONMENT as settings} from '../constants'
import { productSuggestions as productSuggestionsMapping } from '../utils/productMapping'


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

/**
 * Algolia class for performing search and autocomplete operations.
 *
 * @class Algolia
 * @extends ExternalClient
 */
export class Algolia extends ExternalClient {
  private index: any
  private updateIndex: any
  private virtualReplicaASC: any
  private virtualReplicaDESC: any


  // Constructor for the Algolia class
  public constructor(ctx: IOContext, opts?: InstanceOptions) {
    // Call the constructor of the parent class
    super(``, ctx, opts)

    // Initialize the Algolia client for the main index
    const client = algoliasearch(settings.algolia.appId, settings.algolia.searchKey, {
      headers: {
        'x-vtex-use-https': 'true',
        'Proxy-Authorization': ctx.authToken,
      },
      hosts: [{
        url: `${settings.algolia.appId}-dsn.algolia.net`,
        protocol: 'http'
      }]
    })
    this.index = client.initIndex(settings.algolia.indexKey)

    // Initialize the Algolia client for the update index
    const updateClient = algoliasearch(settings.algolia.appId, settings.algolia.adminKey, {
      headers: {
        'x-vtex-use-https': 'true',
        'Proxy-Authorization': ctx.authToken,
      },
      hosts: [{
        url: `${settings.algolia.appId}-dsn.algolia.net`,
        protocol: 'http'
      }]
    })
    this.updateIndex = updateClient.initIndex(settings.algolia.updateKey)

    // Initialize the Algolia client for the ascending virtual replica index
    this.virtualReplicaASC = client.initIndex(settings.algolia.indexKey+'_asc')

    // Initialize the Algolia client for the descending virtual replica index
    this.virtualReplicaDESC = client.initIndex(settings.algolia.indexKey+'_desc')
  }

  /**
   * Performs a search operation using Algolia.
   *
   * @param {string} term - The search term.
   * @param {object} args - Additional arguments for the search operation.
   * @returns {Promise<any>} - The search results.
   */
  public search = async (term: string, args: any = {}) => {
    // Parse the arguments for the search operation
    const parsedArgs = {
      offset: args.offset ?? undefined,
      length: args.length ?? undefined,
      facets: args.facets ?? undefined,
      filters: args.filters ?? undefined,
    }

    // Check if sorting is specified and not 'OrderByScoreDESC'
    if (args.sort && args.sort !== 'OrderByScoreDESC') {
      // Check the sorting type
      if(args.sort === 'OrderByNameASC') {
        // Perform the search using the ascending virtual replica index
        return this.virtualReplicaASC.search(term, parsedArgs)
      } else {
        // Perform the search using the descending virtual replica index
        return this.virtualReplicaDESC.search(term, parsedArgs)
      }
    }
    // Perform the search using the main index
    return this.index.search(term, parsedArgs)
  }

  /**
   * Saves an object to the Algolia update index.
   *
   * @param {object} args - The object to be saved.
   * @returns {Promise<any>} - The result of the save operation.
   */
  public saveObject = async (args: any) => await this.updateIndex.saveObject(args)

  /**
   * Performs an autocomplete operation using Algolia.
   *
   * @param {object} args - The autocomplete arguments.
   * @returns {Promise<{ cacheId: null, itemsReturned: SearchAutocompleteUnit[] }>} - The autocomplete results.
   */
  public autocomplete = async ({ maxRows, searchTerm }: AutocompleteArgs): Promise<{ cacheId: null, itemsReturned: SearchAutocompleteUnit[] }> => {
    // Perform the autocomplete search
    const response: any = await this.index.search(searchTerm, {length: maxRows});

    // Map the response hits to the autocomplete items
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

  /**
   * Performs a product suggestions operation using Algolia.
   *
   * @param {string} translatedTerm - The translated search term.
   * @param {object} args - Additional arguments for the product suggestions operation.
   * @returns {Promise<any>} - The product suggestions.
   */
  public productSuggestions = async (translatedTerm: string, args: any) => {
    // Perform the product suggestions search
    const ret = await this.index.search(translatedTerm, args)
    // Map the search results to product suggestions
    const productsMap = productSuggestionsMapping(ret?.hits)

    return {
      count: ret?.nbHits ?? 0,
      misspelled: null,
      operator: null,
      products: productsMap ?? []
    }
  }
}
