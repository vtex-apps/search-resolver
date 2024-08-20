interface SegmentData {
  campaigns?: any
  channel: number
  priceTables?: any
  utm_campaign: string
  regionId?: string
  utm_source: string
  utmi_campaign: string
  currencyCode: string
  currencySymbol: string
  countryCode: string
  cultureInfo: string
  [key: string]: any
}

interface ElasticImage {
  name: string
  value: string
}

enum IndexingType {
  API = 'API',
  XML = 'XML',
}

interface SearchResultArgs extends AdvertisementOptions {
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

interface BannersArgs {
  fullText: string
  attributePath: string
}

interface RegionSeller {
  id: string
  name: string
}

interface SuggestionProductsArgs {
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

interface SuggestionSearchesArgs {
  term: string
}

interface SelectedFacet {
  value: string
  key: string
}

interface Options {
  allowRedirect?: boolean
}

interface AdvertisementOptions {
  showSponsored?: boolean
  sponsoredCount?: number
  repeatSponsoredProducts?: boolean
  advertisementPlacement?: string
}

interface FacetsInput {
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

interface ProductsInput extends SearchArgs {
  advertisementOptions?: AdvertisementOptions
}

interface ProductSearchInput {
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

interface ElasticAttribute {
  visible: boolean
  active: boolean
  key: string
  label: string
  type: string
  values: ElasticAttributeValue[]
  originalKey: string
  originalLabel: string
  minValue?: number
  maxValue?: number
}

interface ElasticAttributeValue {
  count: number
  active: boolean
  key: string
  label: string
  id: string
  originalKey?: string
  originalLabel?: string
}

interface Breadcrumb {
  href: string
  name: string
}

interface BiggySearchProduct {
  name: string
  id: string
  timestamp: number
  product: string
  description: string
  reference: string
  url: string
  link: string
  oldPrice: number
  price: number
  stock: number
  brand: string
  brandId: string
  installment?: BiggyInstallment
  measurementUnit: string
  unitMultiplier: number
  tax: number
  images: BiggyProductImage[]
  skus: BiggySearchSKU[]
  categories: string[]
  categoryIds: string[]
  extraData: BiggyProductExtraData[]
  productSpecifications: string[]
  specificationGroups: string
  textAttributes: BiggyTextAttribute[]
  numberAttributes: BiggyTextAttribute[]
  split: BiggySplit
  categoryTrees: BiggyCategoryTree[]
  clusterHighlights: Record<string, string>
}

interface BiggySplit {
  labelKey: string
  labelValue: string
}

interface BiggyProductImage {
  name: string
  value: string
}

interface BiggyProductExtraData {
  key: string
  value: string
}

interface BiggySearchSKU {
  name: string
  nameComplete: string
  complementName?: string
  id: string
  ean?: string
  reference: string
  image: string
  images: BiggyProductImage[]
  videos?: string[]
  stock: number
  oldPrice: number
  price: number
  measurementUnit: string
  unitMultiplier: number
  link: string
  attributes: BiggySKUAttribute[]
  sellers: BiggySeller[]
  policies: BiggyPolicy[]
}

interface BiggySKUAttribute {
  key: string
  value: string
}

interface BiggySeller {
  id: string
  name: string
  oldPrice: number
  price: number
  stock: number
  tax: number
  default: boolean
  teasers?: object[]
  installment?: BiggyInstallment
}

interface BiggyInstallment {
  value: number
  count: number
  interest: boolean
}

interface BiggyPolicy {
  id: string
  sellers: BiggySeller[]
}

interface BiggyTextAttribute {
  labelKey: string
  labelValue: string
  key: string
  value: string
  isFilter: boolean
  id: string
  valueId: string
  isSku: boolean
  joinedKey: string
  joinedValue: string
}

interface BiggyCategoryTree {
  categoryNames: string[]
  categoryIds: string[]
}
