import { normalizeProduct } from './product'

describe('normalizeProduct', () => {
  it('returns _type non-array for non-array input', () => {
    expect(normalizeProduct(null as unknown as SearchProduct[])).toEqual({
      _type: 'non-array',
    })
  })

  it('returns empty array for empty input array', () => {
    const out = normalizeProduct([] as SearchProduct[]) as unknown[]

    expect(out).toEqual([])
  })

  it('returns array of objects with exactly SearchProduct keys', () => {
    const products = [
      {
        productId: 'p1',
        linkText: 'link',
        productName: 'Product 1',
        items: [],
      },
    ] as unknown as SearchProduct[]

    const out = normalizeProduct(products) as Array<Record<string, unknown>>

    expect(out).toHaveLength(1)
    const keys = Object.keys(out[0]).sort((a, b) => a.localeCompare(b))

    expect(keys).toEqual(
      [
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
      ].sort((a, b) => a.localeCompare(b))
    )
    expect(out[0].productId).toBe('p1')
    expect(out[0].linkText).toBe('link')
    expect(out[0].productName).toBe('Product 1')
    expect(out[0].items).toEqual([])
    expect(out[0].origin).toBeUndefined()
    expect(out[0].brand).toBe('')
    expect(out[0].itemMetadata).toEqual({ items: [] })
  })

  it('copies existing values and uses defaults for missing keys', () => {
    const products = [
      {
        productId: 'p99',
        categories: ['cat1'],
        clusterHighlights: { h: 'x' },
        extraKey: 'ignored',
      },
    ] as unknown as SearchProduct[]

    const out = normalizeProduct(products) as Array<Record<string, unknown>>

    expect(out[0].productId).toBe('p99')
    expect(out[0].categories).toEqual(['cat1'])
    expect(out[0].clusterHighlights).toEqual({ h: 'x' })
    expect(out[0]).not.toHaveProperty('extraKey')
    expect(out[0].link).toBe('')
    expect(out[0].categoriesIds).toEqual([])
  })

  it('two payloads with different key sets get same keys after normalization', () => {
    const legacy = [
      { productId: 'a', linkText: 'a-link' },
    ] as unknown as SearchProduct[]

    const newPayload = [
      { productId: 'a', linkText: 'a-link', onlyInNew: true },
    ] as unknown as SearchProduct[]

    const normLegacy = normalizeProduct(legacy) as Array<
      Record<string, unknown>
    >

    const normNew = normalizeProduct(newPayload) as Array<
      Record<string, unknown>
    >

    const keysLegacy = Object.keys(normLegacy[0]).sort((a, b) =>
      a.localeCompare(b)
    )

    const keysNew = Object.keys(normNew[0]).sort((a, b) => a.localeCompare(b))

    expect(keysLegacy).toEqual(keysNew)
    expect(normNew[0]).not.toHaveProperty('onlyInNew')
  })
})
