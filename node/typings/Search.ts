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

interface VtexImage {
  cacheId: string
  imageId: string
  imageLabel: string
  imageUrl: string
  imageText: string
}

enum IndexingType {
  API = 'API',
  XML = 'XML',
}

interface SearchResultArgs {
  attributePath: string
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
  fullText: string
  searchState?: string
}

interface SuggestionProductsArgs {
  term: string
  attributeKey?: string
  attributeValue?: string
  tradePolicy?: string
  segment?: SegmentData
  indexingType?: IndexingType
}

interface SuggestionSearchesArgs {
  term: string
}

interface SelectedFacet {
  value: string
  key: string
}

interface FacetsInput {
  selectedFacets: SelectedFacet[]
  fullText: string
  query: string
  searchState?: string
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
}

interface ElasticAttribute {
  visible: boolean
  active: boolean
  key: string
  label: string
  type: string
  values: ElasticAttributeValue[]
  minValue?: number
  maxValue?: number
}

interface ElasticAttributeValue {
  count: number
  active: boolean
  key: string
  label: string
}

interface Breadcrumb {
  href: string
  name: string
}
