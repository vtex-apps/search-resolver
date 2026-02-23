import { structuralCompare } from './structuralCompare'

describe('structuralCompare', () => {
  it('returns no diffs for equal structure (same keys, same array lengths)', () => {
    const a = { x: 1, arr: [1, 2] }
    const b = { x: 99, arr: [3, 4] }
    const result = structuralCompare(a, b)

    expect(result.diffs).toEqual([])
    expect(result.summary).toEqual([])
  })

  it('reports missing_key when legacy has key new does not (new has less)', () => {
    const a = { a: 1, b: 2 }
    const b = { a: 1 }
    const { diffs } = structuralCompare(a, b)

    expect(diffs).toHaveLength(1)
    expect(diffs[0].type).toBe('missing_key')
    expect(diffs[0].path).toBe('b')
    expect(diffs[0].valueA).toBe(2)
    expect(diffs[0].valueB).toBeUndefined()
    expect(structuralCompare(a, b).summary).toEqual(['legacy_has_more'])
  })

  it('reports extra_key when new has key legacy does not (new has more)', () => {
    const a = { a: 1 }
    const b = { a: 1, b: 2 }
    const { diffs } = structuralCompare(a, b)

    expect(diffs).toHaveLength(1)
    expect(diffs[0].type).toBe('extra_key')
    expect(diffs[0].path).toBe('b')
    expect(diffs[0].valueA).toBeUndefined()
    expect(diffs[0].valueB).toBe(2)
    expect(structuralCompare(a, b).summary).toEqual(['new_has_more'])
  })

  it('reports array_length_mismatch with valueA/valueB as lengths', () => {
    const a = { arr: [1, 2] }
    const b = { arr: [1] }
    const { diffs, summary } = structuralCompare(a, b)

    expect(diffs).toHaveLength(1)
    expect(diffs[0].type).toBe('array_length_mismatch')
    expect(diffs[0].valueA).toBe(2)
    expect(diffs[0].valueB).toBe(1)
    expect(summary).toEqual(['both_different'])
  })

  it('reports type_mismatch with valueA and valueB', () => {
    const a = { x: 'str' }
    const b = { x: 123 }
    const { diffs } = structuralCompare(a, b)

    expect(diffs).toHaveLength(1)
    expect(diffs[0].type).toBe('type_mismatch')
    expect(diffs[0].valueA).toBe('str')
    expect(diffs[0].valueB).toBe(123)
  })

  it('reports presence_mismatch with valueA and valueB', () => {
    const a = { x: '' }
    const b = { x: 'hello' }
    const { diffs } = structuralCompare(a, b)

    expect(diffs).toHaveLength(1)
    expect(diffs[0].type).toBe('presence_mismatch')
    expect(diffs[0].valueA).toBe('')
    expect(diffs[0].valueB).toBe('hello')
  })

  it('stops at depth limit', () => {
    let a: unknown = 1
    let b: unknown = 1

    for (let i = 0; i < 12; i++) {
      a = { v: a }
      b = { v: b }
    }

    const { diffs } = structuralCompare(a, b)

    expect(diffs).toHaveLength(0)
  })

  it('compares at most 10 elements per array (does not recurse past index 9)', () => {
    const a = Array.from({ length: 15 }, (_, i) =>
      i === 12 ? { x: [1, 2] } : { x: [1] }
    )

    const b = Array.from({ length: 15 }, (_, i) =>
      i === 12 ? { x: [1] } : { x: [1] }
    )

    const { diffs } = structuralCompare(a, b)

    expect(diffs).toHaveLength(0)
  })

  it('reports diffs only within first 10 array elements', () => {
    const a = Array.from({ length: 20 }, (_, i) => ({
      v: i === 3 ? [1, 2] : [1],
    }))

    const b = Array.from({ length: 20 }, (_, i) => ({
      v: i === 3 ? [1] : [1],
    }))

    const { diffs } = structuralCompare(a, b)

    expect(diffs).toHaveLength(1)
    expect(diffs[0].type).toBe('array_length_mismatch')
    expect(diffs[0].path).toBe('[3].v')
  })

  it('reports array_length_mismatch for product-like arrays when properties[].values length differs', () => {
    const legacy = [
      {
        productId: '2',
        linkText: 'camisa-masculina',
        cacheId: 'camisa-masculina',
        clusterHighlights: [],
        productClusters: [
          { id: '138', name: 'all' },
          { id: '139', name: 'Testezada' },
          { id: '1139', name: 'camisas' },
          { id: '1141', name: 'Teste Agendado' },
          { id: '1142', name: 'Teste Alê' },
        ],
        properties: [
          { name: 'Material', values: [] },
          { name: 'Fabric', values: [] },
        ],
        itemMetadataPresent: false,
        itemsLength: 2,
        items: [
          {
            itemId: '2',
            name: 'Green',
            sellersLength: 1,
            skuSpecifications: [],
          },
          {
            itemId: '33',
            name: 'Red',
            sellersLength: 1,
            skuSpecifications: [],
          },
        ],
      },
    ]

    const shadow = [
      {
        productId: '2',
        linkText: 'classic-blue-tshirt',
        cacheId: 'sp-2',
        clusterHighlights: [],
        productClusters: [
          { id: '138', name: 'all' },
          { id: '139', name: 'Testezada' },
          { id: '1139', name: 'Summer Collection 2024' },
          { id: '1141', name: 'Teste Agendado' },
          { id: '1142', name: 'Teste Alê' },
        ],
        properties: [
          { name: 'Material', values: ['soft'] },
          { name: 'Fabric', values: ['Fabric'] },
        ],
        itemMetadataPresent: false,
        itemsLength: 2,
        items: [
          {
            itemId: '2',
            name: 'Green',
            sellersLength: 1,
            skuSpecifications: [],
          },
          {
            itemId: '33',
            name: "Men's Red T-Shirt",
            sellersLength: 1,
            skuSpecifications: [],
          },
        ],
      },
    ]

    const { diffs, summary } = structuralCompare(legacy, shadow)

    expect(diffs).toHaveLength(2)
    expect(diffs.every((d) => d.type === 'array_length_mismatch')).toBe(true)
    expect(diffs.map((d) => d.path).sort((x, y) => x.localeCompare(y))).toEqual(
      ['[0].properties[0].values', '[0].properties[1].values'].sort((x, y) =>
        x.localeCompare(y)
      )
    )
    expect(diffs.every((d) => d.valueA === 0 && d.valueB === 1)).toBe(true)
    expect(summary).toEqual(['both_different'])
  })

  it('summary contains all categories when diffs are mixed', () => {
    const legacy = { a: 1, b: 2, c: [1, 2] }
    const newObj = { a: 1, x: 99, c: [1] }
    const { diffs, summary } = structuralCompare(legacy, newObj)

    expect(diffs.length).toBeGreaterThanOrEqual(2)
    expect(summary).toContain('legacy_has_more')
    expect(summary).toContain('new_has_more')
    expect(summary).toContain('both_different')
    expect(summary).toHaveLength(3)
  })
})
