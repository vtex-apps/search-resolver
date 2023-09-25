import {
  InstanceOptions,
  IOContext,
  RequestConfig,
  SegmentData,
  CacheType, JanusClient,
} from '@vtex/api'
import { stringify } from 'qs'

import {
  searchEncodeURI,
  SearchCrossSellingTypes,
} from '../resolvers/search/utils'

interface AutocompleteArgs {
  maxRows: number | string
  searchTerm: string
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

interface SearchPageTypeResponse {
  id: string
  pageType: string
  name: string
  url: string
  title: string | null
  metaTagDescription: string | null
}

/** Search API
 * Docs: https://documenter.getpostman.com/view/845/catalogsystem-102/Hs44
 */
export class Search extends JanusClient {
  private searchEncodeURI: (x: string) => string

  private addSalesChannel = (
    url: string,
    salesChannel?: string | number | null,
  ) => {
    if (!salesChannel) {
      return url
    }

    if (!url.includes('?')) {
      return url.concat(`?sc=${salesChannel}`)
    }

    return url.concat(`&sc=${salesChannel}`)
  }

  private addCompleteSpecifications = (url: string) => {
    if (!url.includes('?')) {
      return `${url}?compSpecs=true`
    }

    return `${url}&compSpecs=true`
  }

  private getVtexSegmentCookieAsHeader = (vtexSegment?: string) => {
    return vtexSegment ? { 'x-vtex-segment': vtexSegment } : {}
  }

  public constructor(ctx: IOContext, opts?: InstanceOptions) {
    super(ctx, opts)

    this.searchEncodeURI = searchEncodeURI(ctx.account)
  }

  public pageType = (path: string, query: string = '') => {
    const pageTypePath = encodeURI(path.startsWith('/') ? path.substr(1) : path)

    const pageTypeQuery = !query || query.startsWith('?') ? query : `?${query}`

    return this.get<SearchPageTypeResponse>(
      `/api/catalog_system/pub/portal/pagetype/${pageTypePath}${pageTypeQuery}`,
      { metric: 'search-pagetype' },
    )
  }

  public product = (
    slug: string,
    vtexSegment?: string,
    salesChannel?: string | number | null,
  ) =>
    this.get<SearchProduct[]>(
      this.addCompleteSpecifications(
        this.addSalesChannel(
          `/api/catalog_system/pub/products/search/${this.searchEncodeURI(
            slug && slug.toLowerCase(),
          )}/p`,
          salesChannel,
        ),
      ),
      {
        metric: 'search-product',
        headers: this.getVtexSegmentCookieAsHeader(vtexSegment),
      },
    )

  public productByEan = (
    id: string,
    vtexSegment?: string,
    salesChannel?: string | number | null,
  ) =>
    this.get<SearchProduct[]>(
      this.addCompleteSpecifications(
        this.addSalesChannel(
          `/api/catalog_system/pub/products/search?fq=alternateIds_Ean:${id}`,
          salesChannel,
        ),
      ),
      {
        metric: 'search-productByEan',
        headers: this.getVtexSegmentCookieAsHeader(vtexSegment),
      },
    )

  public productsByEan = (
    ids: string[],
    vtexSegment?: string,
    salesChannel?: string | number | null,
  ) =>
    this.get<SearchProduct[]>(
      this.addCompleteSpecifications(
        this.addSalesChannel(
          `/api/catalog_system/pub/products/search?${ids
            ?.map(id => `fq=alternateIds_Ean:${id}`)
            .join('&')}`,
          salesChannel,
        ),
      ),
      {
        metric: 'search-productByEan',
        headers: this.getVtexSegmentCookieAsHeader(vtexSegment),
      },
    )

  public productById = (
    id: string,
    vtexSegment?: string,
    salesChannel?: string | number | null,
    cacheable: boolean = true,
  ) => {
    const isVtex = this.context.platform === 'vtex'
    const url = isVtex
      ? this.addCompleteSpecifications(
        this.addSalesChannel(
          `/api/catalog_system/pub/products/search?fq=productId:${id}`,
          salesChannel,
        ),
      )
      : `/products/${id}`
    return this.get<SearchProduct[]>(url, {
      metric: 'search-productById',
      headers: this.getVtexSegmentCookieAsHeader(vtexSegment),
      ...(cacheable ? {} : { cacheable: CacheType.None }),
    })
  }

  public productsById = (
    ids: string[],
    vtexSegment?: string,
    salesChannel?: string | number | null,
  ) =>
    this.get<SearchProduct[]>(
      this.addCompleteSpecifications(
        this.addSalesChannel(
          `/api/catalog_system/pub/products/search?${ids
            ?.map(id => `fq=productId:${id}`)
            .join('&')}`,
          salesChannel,
        ),
      ),
      {
        metric: 'search-productById',
        headers: this.getVtexSegmentCookieAsHeader(vtexSegment),
      },
    )

  public productByReference = (
    id: string,
    vtexSegment?: string,
    salesChannel?: string | number | null,
  ) =>
    this.get<SearchProduct[]>(
      this.addCompleteSpecifications(
        this.addSalesChannel(
          `/api/catalog_system/pub/products/search?fq=alternateIds_RefId:${id}`,
          salesChannel,
        ),
      ),
      {
        metric: 'search-productByReference',
        headers: this.getVtexSegmentCookieAsHeader(vtexSegment),
      },
    )

  public productsByReference = (
    ids: string[],
    vtexSegment?: string,
    salesChannel?: string | number | null,
  ) =>
    this.get<SearchProduct[]>(
      this.addCompleteSpecifications(
        this.addSalesChannel(
          `/api/catalog_system/pub/products/search?${ids
            ?.map(id => `fq=alternateIds_RefId:${id}`)
            .join('&')}`,
          salesChannel,
        ),
      ),
      {
        metric: 'search-productByReference',
        headers: this.getVtexSegmentCookieAsHeader(vtexSegment),
      },
    )

  public productBySku = (
    skuId: string,
    vtexSegment?: string,
    salesChannel?: string | number | null,
  ) =>
    this.get<SearchProduct[]>(
      this.addCompleteSpecifications(
        this.addSalesChannel(
          `/api/catalog_system/pub/products/search?fq=skuId:${skuId}`,
          salesChannel,
        ),
      ),
      {
        metric: 'search-productBySku',
        headers: this.getVtexSegmentCookieAsHeader(vtexSegment),
      },
    )

  public productsBySku = (
    skuIds: string[],
    vtexSegment?: string,
    salesChannel?: string | number | null,
  ) =>
    this.get<SearchProduct[]>(
      this.addCompleteSpecifications(
        this.addSalesChannel(
          `/api/catalog_system/pub/products/search?${skuIds
            ?.map(skuId => `fq=skuId:${skuId}`)
            .join('&')}`,
          salesChannel,
        ),
      ),
      {
        metric: 'search-productsBySku',
        headers: this.getVtexSegmentCookieAsHeader(vtexSegment),
      },
    )

  public products = (args: SearchArgs) => {
    return this.get<SearchProduct[]>(this.productSearchUrl(args), {
      metric: 'search-products',
    })
  }

  public brands = () =>
    this.get<Brand[]>('/api/catalog_system/pub/brand/list', { metric: 'search-brands' })

  public categories = (treeLevel: number) =>
    this.get<CategoryTreeResponse[]>(`/api/catalog_system/pub/category/tree/${treeLevel}/`, {
      metric: 'search-categories',
    })

  public getCategoryChildren = (id: number) =>
    this.get<Record<string, string>>(
      `/api/catalog_system/pub/category/categories/children?id=${id}`,
      {
        metric: 'search-category-children',
      },
    )

  public facets = (facets: string = '') => {
    const [path, options] = decodeURI(facets).split('?')
    return this.get<SearchFacets>(
      `/api/catalog_system/pub/facets/search/${encodeURI(
        this.searchEncodeURI(`${path.trim()}${options ? '?' + options : ''}`),
      )}`,
      { metric: 'search-facets' },
    )
  }

  public category = (id: string | number) =>
    this.get<CategoryByIdResponse>(`/api/catalog_system/pub/category/${id}`, {
      metric: 'search-category',
    })

  public crossSelling = (id: string, type: SearchCrossSellingTypes) =>
    this.get<SearchProduct[]>(
      `/api/catalog_system/pub/products/crossselling/${type}/${id}?groupByProduct=true`,
      {
        metric: 'search-crossSelling',
      },
    )

  public filtersInCategoryFromId = (id: string | number) =>
    this.get<FilterListTreeCategoryById[]>(
      `/api/catalog_system/pub/specification/field/listTreeByCategoryId/${id}`,
      {
        metric: 'search-listTreeByCategoryId',
      },
    )

  public autocomplete = ({ maxRows, searchTerm }: AutocompleteArgs) =>
    this.get<{ itemsReturned: SearchAutocompleteUnit[] }>(
      `/buscaautocomplete?maxRows=${maxRows}&productNameContains=${encodeURIComponent(
        this.searchEncodeURI(searchTerm),
      )}`,
      { metric: 'search-autocomplete' },
    )

  private get = <T = any>(url: string, config: RequestConfig = {}) => {
    const segmentData: SegmentData | undefined = (this
      .context! as CustomIOContext).segment
    const { channel: salesChannel = '' } = segmentData || {}

    config.params = {
      ...config.params,
      ...(!!salesChannel && { sc: salesChannel }),
    }
    config.inflightKey = inflightKey

    return this.http.get<T>(`${url}`, config)
  }

  private productSearchUrl = ({
                                query = '',
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
      this.searchEncodeURI(decodeURIComponent(query || '').trim()),
    )
    if (hideUnavailableItems) {
      const segmentData = (this.context as CustomIOContext).segment
      salesChannel = (segmentData && segmentData.channel.toString()) || ''
    }
    let url = `/api/catalog_system/pub/products/search/${sanitizedQuery}?`
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
