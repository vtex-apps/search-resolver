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
  { path: 'skuSpecifications[*].field.type', type: 'missing_key' },
  { path: 'origin', type: 'extra_key' },
  // productReference: catalog data plane does not always carry the product-level refId
  { path: 'productReference', type: 'different_value' },
  // PriceToken: generated internally by the catalog search API, not available in simulation
  {
    path: 'items[*].sellers[*].commertialOffer.PriceToken',
    type: 'missing_key',
  },
  // PriceValidUntil: timezone differences between simulation and catalog search snapshots
  {
    path: 'items[*].sellers[*].commertialOffer.PriceValidUntil',
    type: 'different_value',
  },
  {
    path: 'items[*].sellers[*].commertialOffer.PaymentOptions.paymentSystems[*].dueDate',
    type: 'different_value',
  },
]

/**
 * Existence-based comparison for catalog comparison. Populate as needed.
 */
export const CATALOG_EXISTENCE_COMPARE_FIELDS: ExistenceComparePattern[] = [
  "categories",
  "categoriesIds",
  "allSpecifications",
  { path: 'completeSpecifications', key: 'Name' },
  { path: 'skuSpecifications', key: 'field.name' },
  { path: 'items[*].sellers[*].commertialOffer.PaymentOptions.paymentSystems', key: 'id' },
]
