export type SegmentData = {
  campaigns?: any
  channel: string
  priceTables?: any
  utm_campaign: string | null
  regionId?: string
  utm_source: string | null
  utmi_campaign: string | null
  currencyCode: string
  currencySymbol: string
  countryCode: string
  cultureInfo: string
  [key: string]: any
}

export type IndexingType = 'API' | 'XML'

export type SearchOperator = 'and' | 'or'

export type SimulationBehavior =
  | 'default'
  | 'only1P'
  | 'skip'
  | 'async'
  | 'regionalize1p'

export type CategoryTreeBehavior = 'default' | 'show' | 'hide'

export interface SearchResultArgs extends AdvertisementOptions {
  attributePath?: string
  query?: string
  sort?: string
  operator?: SearchOperator
  fuzzy?: string
  leap?: boolean
  tradePolicy?: number
  segment?: SegmentData
  indexingType?: IndexingType
  searchState?: string
  sellers?: RegionSeller[]
  hideUnavailableItems?: boolean | null
  removeHiddenFacets?: boolean | null
  options?: Options
  initialAttributes?: string
  workspaceSearchParams?: object
  regionId?: string | null
  from?: number | null
  to?: number | null
  showSponsored?: boolean
}

export type RegionSeller = {
  id: string
  name: string
}

export interface SuggestionProductsArgs {
  fullText: string
  facetKey?: string
  facetValue?: string
  salesChannel?: number
  segment?: SegmentData
  indexingType?: IndexingType
  productOriginVtex: boolean
  simulationBehavior: SimulationBehavior | null
  hideUnavailableItems?: boolean | null
  regionId?: string
  workspaceSearchParams?: object
  segmentedFacets?: SelectedFacet[]
  orderBy?: string
  count?: number
  shippingOptions?: string[]
  advertisementOptions: AdvertisementOptions
}

/** Facet chosen in the storefront / GraphQL (`SelectedFacetInput`). */
export interface SelectedFacet {
  key: string
  value: string
}

export interface Options {
  allowRedirect?: boolean
}

export interface AdvertisementOptions {
  showSponsored?: boolean
  sponsoredCount?: number
  repeatSponsoredProducts?: boolean
  advertisementPlacement?: string
}

/** Arguments for the `facets` GraphQL query (see vtex.search-graphql schema). */
export interface FacetsInput {
  query?: string
  fullText?: string
  map?: string
  selectedFacets?: SelectedFacet[]
  hideUnavailableItems?: boolean | null
  removeHiddenFacets?: boolean
  behavior?: string
  operator?: SearchOperator
  fuzzy?: string
  searchState?: string
  // from?: number this shouldn't be used
  // to?: number this shouldn't be used
  categoryTreeBehavior?: CategoryTreeBehavior
  initialAttributes?: string
  variant?: string
}

export interface ProductsInput extends SearchArgs {
  advertisementOptions?: AdvertisementOptions
}

/** Arguments for the `productSearch` GraphQL query (see vtex.search-graphql schema). */
export interface ProductSearchInput {
  query?: string
  fullText?: string
  map?: string
  selectedFacets?: SelectedFacet[]
  category?: string
  specificationFilters?: string[]
  priceRange?: string
  collection?: string
  salesChannel?: string
  orderBy?: string
  from?: number
  to?: number
  hideUnavailableItems?: boolean | null
  simulationBehavior?: SimulationBehavior
  productOriginVtex?: boolean
  operator?: SearchOperator
  fuzzy?: string
  searchState?: string
  options?: Options
  variant?: string
  /** @deprecated Prefer `advertisementOptions`. */
  showSponsored?: boolean
  advertisementOptions?: AdvertisementOptions
  origin?: string
}
