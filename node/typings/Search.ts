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

export interface SearchResultArgs extends AdvertisementOptions {
  attributePath?: string
  query?: string
  page?: number
  count?: number
  sort?: string
  operator?: string
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

interface RegionSeller {
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
  simulationBehavior: 'skip' | 'default' | 'only1P' | null
  hideUnavailableItems?: boolean | null
  regionId?: string
  workspaceSearchParams?: object
  segmentedFacets?: SelectedFacet[]
  orderBy?: string
  count?: number
  shippingOptions?: string[]
  advertisementOptions: AdvertisementOptions
}

interface SelectedFacet {
  value: string
  key: string
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

export interface FacetsInput {
  map: string
  selectedFacets: SelectedFacet[]
  fullText: string
  query: string
  searchState?: string
  removeHiddenFacets: boolean
  hideUnavailableItems: boolean
  initialAttributes?: string
  categoryTreeBehavior: 'default' | 'show' | 'hide'
}

export interface ProductsInput extends SearchArgs {
  advertisementOptions?: AdvertisementOptions
}

export interface ProductSearchInput {
  query: string
  from: number
  to: number
  selectedFacets: SelectedFacet[]
  fullText: string
  fuzzy: string
  operator: string
  orderBy: string
  productOriginVtex: boolean
  searchState?: string
  simulationBehavior: 'skip' | 'default' | null
  hideUnavailableItems: boolean
  map?: string
  options?: Options
  showSponsored?: boolean
  advertisementOptions?: AdvertisementOptions
}