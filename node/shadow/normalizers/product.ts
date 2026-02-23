/**
 * Normalizes SearchProduct[] to a canonical shape aligned to the SearchProduct type.
 * Ensures both legacy and new payloads have the same set of keys (with defaults for
 * missing ones) so structuralCompare only reports meaningful diffs: missing_key,
 * extra_key, array_length_mismatch, type_mismatch, presence_mismatch.
 * Does not run resolvers.
 */

const SEARCH_PRODUCT_KEYS = [
  'origin',
  'productId',
  'productName',
  'brand',
  'brandId',
  'linkText',
  'productReference',
  'categoryId',
  'productTitle',
  'metaTagDescription',
  'clusterHighlights',
  'productClusters',
  'searchableClusters',
  'categories',
  'categoriesIds',
  'link',
  'description',
  'items',
  'itemMetadata',
  'titleTag',
  'Specifications',
  'allSpecifications',
  'allSpecificationsGroups',
  'completeSpecifications',
  'skuSpecifications',
  'specificationGroups',
  'properties',
] as const

const DEFAULT_BY_KEY: Record<string, unknown> = {
  origin: undefined,
  brandId: undefined,
  clusterHighlights: {},
  productClusters: {},
  searchableClusters: {},
  categories: [],
  categoriesIds: [],
  Specifications: [],
  allSpecifications: [],
  allSpecificationsGroups: [],
  items: [],
  completeSpecifications: [],
  skuSpecifications: [],
  specificationGroups: [],
  properties: [],
  itemMetadata: { items: [] },
  productId: '',
  productName: '',
  brand: '',
  linkText: '',
  productReference: '',
  categoryId: '',
  productTitle: '',
  metaTagDescription: '',
  link: '',
  description: '',
  titleTag: '',
}

function defaultForKey(key: string): unknown {
  return key in DEFAULT_BY_KEY ? DEFAULT_BY_KEY[key] : undefined
}

/**
 * Projects a single product-like object to the canonical SearchProduct shape:
 * exactly the keys of SearchProduct, with values from the payload or defaults.
 */
function projectToSearchProductShape(
  item: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  for (const key of SEARCH_PRODUCT_KEYS) {
    out[key] = item[key] !== undefined ? item[key] : defaultForKey(key)
  }

  return out
}

/**
 * Ensures the payload is normalized to a comparable SearchProduct[] shape.
 * Both legacy and new responses should be passed through this so structuralCompare
 * sees the same key set and only reports the four diff types (missing_key, extra_key,
 * array_length_mismatch, type_mismatch, presence_mismatch).
 */
export function normalizeProduct(products: SearchProduct[]): unknown {
  if (!Array.isArray(products)) {
    return { _type: 'non-array' }
  }

  return products.map((p) =>
    projectToSearchProductShape(p as unknown as Record<string, unknown>)
  )
}
