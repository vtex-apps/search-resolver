import type {
  ExistenceComparePattern,
  IgnoredDifference,
} from '../utils/compareResults'

/**
 * Known expected differences when comparing PDP (productOriginVtex=true) vs catalog/portal search.
 * Populate as differences are discovered.
 */
export const CATALOG_IGNORED_DIFFERENCES: IgnoredDifference[] = [
  // Actual
  { path: '[*].skuSpecifications[*].field.type', type: 'missing_key' },
  { path: '[*].origin', type: 'extra_key' },
  // IS/intsch mapping adds these; catalog/portal search does not
  { path: '[*].items[*].offerOrigin', type: 'extra_key' },
  { path: '[*].items[*].attributes', type: 'extra_key' },
  { path: '[*].allSpecifications', type: 'extra_key' },
  { path: '[*].allSpecificationsGroups', type: 'extra_key' },
  // productReference: catalog data plane does not always carry the product-level refId
  { path: '[*].productReference', type: 'different_value' },
  // PriceToken: generated internally by the catalog search API, not available in simulation
  {
    path: '[*].items[*].sellers[*].commertialOffer.PriceToken',
    type: 'missing_key',
  },
  // PriceValidUntil: timezone differences between simulation and catalog search snapshots
  {
    path: '[*].items[*].sellers[*].commertialOffer.PriceValidUntil',
    type: 'different_value',
  },
  {
    path: '[*].items[*].sellers[*].commertialOffer.PaymentOptions.paymentSystems[*].dueDate',
    type: 'different_value',
  },
  {
    // For some reason the portal proxy returns a link starting with portal.vtexcommercestable.com.br/ instead of ACCOUNt.vtexcommercestable.com.br
    path: '[*].link',
    type: 'different_value',
  },
  {
    path: '[*].items[*].sellers[*].addToCartLink',
    type: 'different_value',
  },
  // This info doesn't exist on portal search and it is added by the intelligent-search-api mapping
  {
    path: '[*].biggyIndex',
    type: 'missing_key',
  },
  {
    path: '[*].sellerId',
    type: 'missing_key',
  },
  {
    path: '[*].allSpecifications[name:sellerId]',
    type: 'missing_key',
  },
  // Intsch caps product clusters at 50 (highlights first); catalog/portal can return more
  { path: '[*].productClusters.*', type: 'missing_key' },
  // Intsch often omits brand image while catalog/portal indexes the logo URL
  { path: '[*].brandImageUrl' },
  // Catalog serializes missing alt as null; intsch always emits a string ("" or label)
  {
    path: '[*].items[*].images[*].imageText',
    type: 'null_mismatch',
  },
  // Not exposed on search-graphql Product/SKU/Offer — compare-only payload noise
  { path: '[*].items[*].sellers[*].commertialOffer.PaymentOptions**' },
  { path: '[*].items[*].sellers[*].commertialOffer.FullSellingPrice' },
  { path: '[*].items[*].sellers[*].commertialOffer.IsAvailable' },
  {
    path: '[*].items[*].sellers[*].commertialOffer.DeliverySlaSamplesPerRegion**',
  },
  {
    path: '[*].items[*].sellers[*].commertialOffer.ItemMetadataAttachment**',
  },
  { path: '[*].SellerVSS**' },
  // PascalCase twin of Teasers; GraphQL Offer.teasers reads teasers ?? Teasers only
  {
    path: '[*].items[*].sellers[*].commertialOffer.PromotionTeasers**',
  },
  // completeSpecifications is not a GraphQL field; intsch often duplicates Values
  // as numeric Id plus name-as-Id. Extra specs by Name still log.
  {
    path: '[*].completeSpecifications[*].Values',
    type: 'array_length_mismatch',
  },
  {
    path: '[*].completeSpecifications[*].Values[*]',
    type: 'extra_key',
  },
  // Potential indexing differences
  {
    path: '[*].items[*].sellers[*].commertialOffer.GetInfoErrorMessage',
    type: 'null_mismatch',
  },
  {
    path: '[*].allSpecificationsGroups',
    type: 'array_length_mismatch',
  },
  {
    path: '[*].allSpecificationsGroups[*]',
    type: 'different_value',
  },
  {
    path: '[*].allSpecificationsGroups[*]',
    type: 'extra_key',
  },
]

/**
 * Existence-based comparison for catalog comparison. Populate as needed.
 */
export const CATALOG_EXISTENCE_COMPARE_FIELDS: ExistenceComparePattern[] = [
  '[*].categories',
  '[*].categoriesIds',
  '[*].allSpecifications',
  { path: '[*].completeSpecifications', key: 'Name' },
  { path: '[*].skuSpecifications', key: 'field.name' },
  {
    path: '[*].skuSpecifications[*].values',
    key: 'id',
  },
  {
    path: '[*].items[*].sellers[*].commertialOffer.PaymentOptions.paymentSystems',
    key: 'id',
  },
  {
    path: '[*].items[*].sellers[*].commertialOffer.Installments',
    key: 'Name',
  },
]
