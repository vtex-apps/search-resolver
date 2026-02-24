import type { Logger } from '@vtex/api'

import {
  isDeepEqual,
  compareApiResults,
  findDifferences,
  filterIgnoredDifferences,
  shouldIgnoreDifference,
  type IgnoredDifference,
  type ObjectDifference,
} from './compareResults'

describe('isDeepEqual', () => {
  // Basic equality tests
  describe('basic equality', () => {
    it('should return true for identical primitive values', () => {
      expect(isDeepEqual(1, 1).isEqual).toBe(true)
      expect(isDeepEqual('hello', 'hello').isEqual).toBe(true)
      expect(isDeepEqual(true, true).isEqual).toBe(true)
      expect(isDeepEqual(null, null).isEqual).toBe(true)
      expect(isDeepEqual(undefined, undefined).isEqual).toBe(true)
    })

    it('should return false for different primitive values', () => {
      expect(isDeepEqual(1, 2).isEqual).toBe(false)
      expect(isDeepEqual('hello', 'world').isEqual).toBe(false)
      expect(isDeepEqual(true, false).isEqual).toBe(false)
      expect(isDeepEqual(null, undefined).isEqual).toBe(false)
      expect(isDeepEqual(0, null).isEqual).toBe(false)
      expect(isDeepEqual('', null).isEqual).toBe(false)
    })

    it('should handle empty arrays and objects', () => {
      expect(isDeepEqual([], []).isEqual).toBe(true)
      expect(isDeepEqual({}, {}).isEqual).toBe(true)
      expect(isDeepEqual([], {}).isEqual).toBe(false)
    })
  })

  // Simple objects and arrays tests
  describe('simple objects and arrays', () => {
    it('should compare simple arrays correctly', () => {
      expect(isDeepEqual([1, 2, 3], [1, 2, 3]).isEqual).toBe(true)
      expect(isDeepEqual([1, 2, 3], [1, 2, 4]).isEqual).toBe(false)
      expect(isDeepEqual([1, 2], [1, 2, 3]).isEqual).toBe(false)
    })

    it('should compare simple objects correctly', () => {
      expect(isDeepEqual({ a: 1, b: 2 }, { a: 1, b: 2 }).isEqual).toBe(true)
      expect(isDeepEqual({ a: 1, b: 2 }, { a: 1, b: 3 }).isEqual).toBe(false)
      expect(isDeepEqual({ a: 1 }, { a: 1, b: 2 }).isEqual).toBe(false)
      expect(isDeepEqual({ a: 1, b: 2 }, { b: 2, a: 1 }).isEqual).toBe(true) // order doesn't matter
    })

    it('should handle arrays with objects', () => {
      expect(isDeepEqual([{ a: 1 }], [{ a: 1 }]).isEqual).toBe(true)
      expect(isDeepEqual([{ a: 1 }], [{ a: 2 }]).isEqual).toBe(false)
    })

    it('should handle objects with arrays', () => {
      expect(isDeepEqual({ a: [1, 2] }, { a: [1, 2] }).isEqual).toBe(true)
      expect(isDeepEqual({ a: [1, 2] }, { a: [1, 3] }).isEqual).toBe(false)
    })
  })

  // Complex objects tests
  describe('complex nested objects', () => {
    it('should handle deeply nested objects', () => {
      const obj1 = {
        a: 1,
        b: {
          c: [1, 2, 3],
          d: {
            e: 'hello',
            f: {
              g: true,
            },
          },
        },
      }

      const obj2 = {
        a: 1,
        b: {
          c: [1, 2, 3],
          d: {
            e: 'hello',
            f: {
              g: true,
            },
          },
        },
      }

      const obj3 = {
        a: 1,
        b: {
          c: [1, 2, 3],
          d: {
            e: 'hello',
            f: {
              g: false, // Different value here
            },
          },
        },
      }

      expect(isDeepEqual(obj1, obj2).isEqual).toBe(true)
      expect(isDeepEqual(obj1, obj3).isEqual).toBe(false)
    })

    it('should handle circular references', () => {
      const obj1: Record<string, unknown> = { a: 1 }
      const obj2: Record<string, unknown> = { a: 1 }

      // Create circular references
      obj1.self = obj1
      obj2.self = obj2

      // These should fail as we're not specifically handling circular references
      // But we want to make sure it doesn't cause an infinite loop
      expect(() => isDeepEqual(obj1, obj2)).not.toThrow()
    })

    it('should handle arrays with mixed types', () => {
      const arr1 = [1, 'string', true, { a: 1 }, [1, 2]]
      const arr2 = [1, 'string', true, { a: 1 }, [1, 2]]
      const arr3 = [1, 'string', true, { a: 2 }, [1, 2]]

      expect(isDeepEqual(arr1, arr2).isEqual).toBe(true)
      expect(isDeepEqual(arr1, arr3).isEqual).toBe(false)
    })

    it('should handle objects with same content but different property order in nested arrays', () => {
      const obj1 = {
        searches: [
          {
            term: 'areia',
            count: 217,
            attributes: [
              {
                key: 'departamento',
                labelKey: 'Departamento',
                labelValue: 'Material de Construção',
                value: 'material-de-construcao',
              },
              {
                key: 'categoria',
                labelKey: 'Categoria',
                labelValue: 'Materiais básicos para obra',
                value: 'materiais-basicos-para-obra',
              },
              {
                key: 'subcategoria',
                labelKey: 'Subcategoria',
                labelValue: 'Areias',
                value: 'areias',
              },
            ],
          },
          {
            term: 'vaso caixa acoplada',
            count: 239,
          },
          {
            term: 'caixa acoplada',
            count: 86,
          },
          {
            term: 'vasos caixa acopladas',
            count: 66,
          },
          {
            term: 'kit vaso caixa acoplada',
            count: 117,
          },
        ],
      }

      const obj2 = {
        searches: [
          {
            term: 'areia',
            count: 217,
            attributes: [
              {
                key: 'departamento',
                value: 'material-de-construcao',
                labelKey: 'Departamento',
                labelValue: 'Material de Construção',
              },
              {
                key: 'categoria',
                value: 'materiais-basicos-para-obra',
                labelKey: 'Categoria',
                labelValue: 'Materiais básicos para obra',
              },
              {
                key: 'subcategoria',
                value: 'areias',
                labelKey: 'Subcategoria',
                labelValue: 'Areias',
              },
            ],
          },
          {
            term: 'vaso caixa acoplada',
            count: 239,
          },
          {
            term: 'caixa acoplada',
            count: 86,
          },
          {
            term: 'vasos caixa acopladas',
            count: 66,
          },
          {
            term: 'kit vaso caixa acoplada',
            count: 117,
          },
        ],
      }

      // These objects should be considered equal since they have the same content
      // but different property order in the attributes objects
      expect(isDeepEqual(obj1, obj2).isEqual).toBe(true)
    })
  })

  // maxDepth parameter tests
  describe('maxDepth parameter', () => {
    it('should respect the maxDepth parameter for nested objects', () => {
      const deepObj1 = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep',
              },
            },
          },
        },
      }

      const deepObj2 = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'different',
              },
            },
          },
        },
      }

      // With default depth (20), the difference should be detected
      expect(isDeepEqual(deepObj1, deepObj2).isEqual).toBe(false)

      // With depth of 3, the difference at level4 should not be detected
      expect(isDeepEqual(deepObj1, deepObj2, { maxDepth: 3 }).isEqual).toBe(
        true
      )

      // With depth of 4, the difference should be detected
      expect(isDeepEqual(deepObj1, deepObj2, { maxDepth: 4 }).isEqual).toBe(
        false
      )
    })

    it('should respect the maxDepth parameter for nested arrays', () => {
      const nestedArray1 = [1, [2, [3, [4, [5, 6]]]]]
      const nestedArray2 = [1, [2, [3, [4, [5, 7]]]]]

      // With default depth, the difference should be detected
      expect(isDeepEqual(nestedArray1, nestedArray2).isEqual).toBe(false)

      // With depth of 4, the difference at the deepest level should not be detected
      expect(
        isDeepEqual(nestedArray1, nestedArray2, { maxDepth: 3 }).isEqual
      ).toBe(true)

      // With depth of 5, the difference should be detected
      expect(
        isDeepEqual(nestedArray1, nestedArray2, { maxDepth: 4 }).isEqual
      ).toBe(false)
    })
  })

  describe('difference detection', () => {
    it('should return differences when using returnDifferences option', () => {
      const obj1 = { name: 'John', age: 25 }
      const obj2 = { name: 'Jane', age: 30 }

      const result = isDeepEqual(obj1, obj2)

      expect(result.isEqual).toBe(false)
      expect(result.differences).toHaveLength(2)
      expect(result.differences).toEqual([
        {
          path: 'name',
          type: 'different_value',
          expected: 'John',
          actual: 'Jane',
        },
        {
          path: 'age',
          type: 'different_value',
          expected: 25,
          actual: 30,
        },
      ])
    })

    it('should return no differences when objects are equal', () => {
      const obj1 = { name: 'John', age: 25 }
      const obj2 = { name: 'John', age: 25 }

      const result = isDeepEqual(obj1, obj2)

      expect(result.isEqual).toBe(true)
      expect(result.differences).toHaveLength(0)
    })

    it('should detect missing and extra keys', () => {
      const obj1 = { name: 'John', age: 25 }
      const obj2 = { name: 'John', email: 'john@example.com' }

      const result = isDeepEqual(obj1, obj2)

      expect(result.isEqual).toBe(false)
      expect(result.differences).toHaveLength(2)
      expect(result.differences).toEqual(
        expect.arrayContaining([
          {
            path: 'age',
            type: 'extra_key',
            expected: 25,
          },
          {
            path: 'email',
            type: 'missing_key',
            actual: 'john@example.com',
          },
        ])
      )
    })

    it('should detect nested differences with correct paths', () => {
      const obj1 = {
        user: {
          profile: {
            name: 'John',
            preferences: { theme: 'dark' },
          },
        },
      }

      const obj2 = {
        user: {
          profile: {
            name: 'Jane',
            preferences: { theme: 'light' },
          },
        },
      }

      const result = isDeepEqual(obj1, obj2)

      expect(result.isEqual).toBe(false)
      expect(result.differences).toHaveLength(2)
      expect(result.differences).toEqual([
        {
          path: 'user.profile.name',
          type: 'different_value',
          expected: 'John',
          actual: 'Jane',
        },
        {
          path: 'user.profile.preferences.theme',
          type: 'different_value',
          expected: 'dark',
          actual: 'light',
        },
      ])
    })

    it('should detect array differences', () => {
      const arr1 = [1, 2, { value: 'a' }]
      const arr2 = [1, 3, { value: 'b' }]

      const result = isDeepEqual(arr1, arr2)

      expect(result.isEqual).toBe(false)
      expect(result.differences).toHaveLength(2)
      expect(result.differences).toEqual([
        {
          path: '[1]',
          type: 'different_value',
          expected: 2,
          actual: 3,
        },
        {
          path: '[2].value',
          type: 'different_value',
          expected: 'a',
          actual: 'b',
        },
      ])
    })

    it('should detect type differences', () => {
      const obj1 = { value: 'string' }
      const obj2 = { value: 42 }

      const result = isDeepEqual(obj1, obj2)

      expect(result.isEqual).toBe(false)
      expect(result.differences).toHaveLength(1)
      expect(result.differences[0]).toEqual({
        path: 'value',
        type: 'different_type',
        expected: 'string',
        actual: 'number',
      })
    })
  })
})

describe('findDifferences', () => {
  it('should find differences between simple objects', () => {
    const obj1 = { a: 1, b: 2 }
    const obj2 = { a: 1, b: 3, c: 4 }

    const differences = findDifferences(obj1, obj2)

    expect(differences).toHaveLength(2)
    expect(differences).toEqual(
      expect.arrayContaining([
        {
          path: 'b',
          type: 'different_value',
          expected: 2,
          actual: 3,
        },
        {
          path: 'c',
          type: 'missing_key',
          actual: 4,
        },
      ])
    )
  })

  it('should respect maxDepth parameter', () => {
    const deep1 = { level1: { level2: { level3: { value: 'a' } } } }
    const deep2 = { level1: { level2: { level3: { value: 'b' } } } }

    const differences = findDifferences(deep1, deep2, '', { maxDepth: 2 })

    expect(differences).toHaveLength(0) // Should not find differences beyond maxDepth
  })

  it('should treat strings as equal if they only differ after 2000 chars', () => {
    const base = 'a'.repeat(2000)
    const str1 = `${base}XXXXX`
    const str2 = `${base}YYYYY`

    const differences = findDifferences({ text: str1 }, { text: str2 })

    expect(differences).toHaveLength(0)
  })

  it('should detect differences within the first 2000 chars of strings', () => {
    const str1 = `${'a'.repeat(1999)}X${'z'.repeat(100)}`
    const str2 = `${'a'.repeat(1999)}Y${'z'.repeat(100)}`

    const differences = findDifferences({ text: str1 }, { text: str2 })

    expect(differences).toHaveLength(1)
    expect(differences[0].type).toBe('different_value')
  })
})

describe('existence-based array comparison', () => {
  it('should compare object arrays by nested key (e.g. field.name) regardless of order', () => {
    const obj1 = {
      skuSpecifications: [
        {
          field: { name: 'Size', originalName: 'Size' },
          values: [{ name: '76W', originalName: '76W' }],
        },
        {
          field: { name: 'Colour', originalName: 'Colour' },
          values: [{ name: 'Blue', originalName: 'Blue' }],
        },
      ],
    }

    const obj2 = {
      skuSpecifications: [
        {
          field: { name: 'Colour', originalName: 'Colour' },
          values: [{ name: 'Blue', originalName: 'Blue' }],
        },
        {
          field: { name: 'Size', originalName: 'Size' },
          values: [{ name: '76W', originalName: '76W' }],
        },
      ],
    }

    const result = isDeepEqual(obj1, obj2, {
      existenceCompareFields: [
        { path: 'skuSpecifications', key: 'field.name' },
      ],
    })

    expect(result.isEqual).toBe(true)
    expect(result.differences).toHaveLength(0)
  })

  it('should detect value differences in object arrays matched by nested key', () => {
    const obj1 = {
      skuSpecifications: [
        {
          field: { name: 'Size', originalName: 'Size' },
          values: [{ name: '76W', originalName: '76W' }],
        },
        {
          field: { name: 'Colour', originalName: 'Colour' },
          values: [{ name: 'Blue', originalName: 'Blue' }],
        },
      ],
    }

    const obj2 = {
      skuSpecifications: [
        {
          field: { name: 'Colour', originalName: 'Colour' },
          values: [{ name: 'Red', originalName: 'Red' }],
        },
        {
          field: { name: 'Size', originalName: 'Size' },
          values: [{ name: '76W', originalName: '76W' }],
        },
      ],
    }

    const result = isDeepEqual(obj1, obj2, {
      existenceCompareFields: [
        { path: 'skuSpecifications', key: 'field.name' },
      ],
    })

    expect(result.isEqual).toBe(false)
    expect(result.differences).toEqual([
      {
        path: 'skuSpecifications[name:Colour].values[0].name',
        type: 'different_value',
        expected: 'Blue',
        actual: 'Red',
      },
      {
        path: 'skuSpecifications[name:Colour].values[0].originalName',
        type: 'different_value',
        expected: 'Blue',
        actual: 'Red',
      },
    ])
  })

  it('should detect missing and extra elements in object arrays matched by nested key', () => {
    const obj1 = {
      skuSpecifications: [
        {
          field: { name: 'Size', originalName: 'Size' },
          values: [{ name: '76W', originalName: '76W' }],
        },
      ],
    }

    const obj2 = {
      skuSpecifications: [
        {
          field: { name: 'Colour', originalName: 'Colour' },
          values: [{ name: 'Blue', originalName: 'Blue' }],
        },
      ],
    }

    const result = isDeepEqual(obj1, obj2, {
      existenceCompareFields: [
        { path: 'skuSpecifications', key: 'field.name' },
      ],
    })

    expect(result.isEqual).toBe(false)
    expect(result.differences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'skuSpecifications[name:Colour]',
          type: 'missing_key',
        }),
        expect.objectContaining({
          path: 'skuSpecifications[name:Size]',
          type: 'extra_key',
        }),
      ])
    )
  })

  it('should compare primitive arrays by value regardless of order', () => {
    const obj1 = {
      categories: ['/Electronics/Phones/', '/Electronics/Tablets/'],
    }

    const obj2 = {
      categories: ['/Electronics/Tablets/', '/Electronics/Phones/'],
    }

    const result = isDeepEqual(obj1, obj2, {
      existenceCompareFields: ['categories'],
    })

    expect(result.isEqual).toBe(true)
    expect(result.differences).toHaveLength(0)
  })

  it('should fall back to positional comparison for objects missing the key', () => {
    const obj1 = {
      skuSpecifications: [
        {
          field: { name: 'Size', originalName: 'Size' },
          values: [{ name: '76W', originalName: '76W' }],
        },
        {
          values: [{ name: 'Unknown', originalName: 'Unknown' }],
        },
      ],
    }

    const obj2 = {
      skuSpecifications: [
        {
          values: [{ name: 'Unknown', originalName: 'Unknown' }],
        },
        {
          field: { name: 'Size', originalName: 'Size' },
          values: [{ name: '76W', originalName: '76W' }],
        },
      ],
    }

    const result = isDeepEqual(obj1, obj2, {
      existenceCompareFields: [
        { path: 'skuSpecifications', key: 'field.name' },
      ],
    })

    expect(result.isEqual).toBe(true)
    expect(result.differences).toHaveLength(0)
  })

  it('should compare keyless objects positionally and keyed objects by key', () => {
    const obj1 = {
      skuSpecifications: [
        {
          field: { name: 'Size', originalName: 'Size' },
          values: [{ name: '76W', originalName: '76W' }],
        },
        {
          values: [{ name: 'A', originalName: 'A' }],
        },
      ],
    }

    const obj2 = {
      skuSpecifications: [
        {
          values: [{ name: 'B', originalName: 'B' }],
        },
        {
          field: { name: 'Size', originalName: 'Size' },
          values: [{ name: '76W', originalName: '76W' }],
        },
      ],
    }

    const result = isDeepEqual(obj1, obj2, {
      existenceCompareFields: [
        { path: 'skuSpecifications', key: 'field.name' },
      ],
    })

    expect(result.isEqual).toBe(false)
    expect(result.differences).toEqual(
      expect.arrayContaining([
        {
          path: 'skuSpecifications[0].values[0].name',
          type: 'different_value',
          expected: 'A',
          actual: 'B',
        },
        {
          path: 'skuSpecifications[0].values[0].originalName',
          type: 'different_value',
          expected: 'A',
          actual: 'B',
        },
      ])
    )
  })

  it('should detect missing and extra elements in primitive arrays', () => {
    const obj1 = {
      categories: ['/Electronics/Phones/', '/Electronics/Tablets/'],
    }

    const obj2 = {
      categories: ['/Electronics/Phones/', '/Electronics/TVs/'],
    }

    const result = isDeepEqual(obj1, obj2, {
      existenceCompareFields: ['categories'],
    })

    expect(result.isEqual).toBe(false)
    expect(result.differences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'categories[name:/Electronics/TVs/]',
          type: 'missing_key',
        }),
        expect.objectContaining({
          path: 'categories[name:/Electronics/Tablets/]',
          type: 'extra_key',
        }),
      ])
    )
  })
})

describe('nested existence-based comparison with ignore patterns', () => {
  const biggyResponse = {
    products: [
      {
        specificationGroups: [
          {
            originalName: 'allSpecifications',
            name: 'allSpecifications',
            specifications: [
              {
                originalName: 'Material',
                name: 'Material',
                values: ['soft'],
              },
              {
                originalName: 'Fabric',
                name: 'Fabric',
                values: ['Fabric'],
              },
              {
                originalName: 'sellerId',
                name: 'sellerId',
                values: ['1'],
              },
            ],
          },
        ],
        properties: [
          { originalName: 'Material', name: 'Material', values: ['soft'] },
          { originalName: 'Fabric', name: 'Fabric', values: ['Fabric'] },
          { originalName: 'sellerId', name: 'sellerId', values: ['1'] },
        ],
      },
    ],
  }

  const intschResponse = {
    products: [
      {
        specificationGroups: [
          {
            originalName: 'allSpecifications',
            name: 'allSpecifications',
            specifications: [
              {
                originalName: 'Fabric',
                name: 'Fabric',
                values: ['Fabric'],
              },
              {
                originalName: 'Material',
                name: 'Material',
                values: ['soft'],
              },
            ],
          },
        ],
        properties: [
          { originalName: 'Fabric', name: 'Fabric', values: ['Fabric'] },
          { originalName: 'Material', name: 'Material', values: ['soft'] },
        ],
      },
    ],
  }

  it('should produce [name:sellerId] paths when specifications uses existence comparison', () => {
    const result = isDeepEqual(biggyResponse, intschResponse, {
      existenceCompareFields: [
        { path: 'products[*].specificationGroups', key: 'name' },
        {
          path: 'products[*].specificationGroups[*].specifications',
          key: 'name',
        },
        { path: 'products[*].properties', key: 'name' },
      ],
    })

    expect(result.isEqual).toBe(false)
    expect(result.differences).toEqual([
      {
        path: 'products[0].specificationGroups[name:allSpecifications].specifications[name:sellerId]',
        type: 'extra_key',
        expected: {
          originalName: 'sellerId',
          name: 'sellerId',
          values: ['1'],
        },
      },
      {
        path: 'products[0].properties[name:sellerId]',
        type: 'extra_key',
        expected: {
          originalName: 'sellerId',
          name: 'sellerId',
          values: ['1'],
        },
      },
    ])
  })

  it('should produce numeric index paths when specifications does NOT use existence comparison', () => {
    const result = isDeepEqual(biggyResponse, intschResponse, {
      existenceCompareFields: [
        { path: 'products[*].specificationGroups', key: 'name' },
        { path: 'products[*].properties', key: 'name' },
      ],
    })

    expect(result.isEqual).toBe(false)
    const specDiffs = result.differences.filter((d) =>
      d.path.includes('specifications')
    )

    expect(specDiffs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'products[0].specificationGroups[name:allSpecifications].specifications',
          type: 'array_length_mismatch',
        }),
      ])
    )

    expect(specDiffs.some((d) => d.path.includes('specifications[2]'))).toBe(
      true
    )

    expect(specDiffs.some((d) => d.path.includes('[name:sellerId]'))).toBe(
      false
    )
  })

  it('should allow ignore patterns to filter sellerId when specifications uses existence comparison', () => {
    const result = isDeepEqual(biggyResponse, intschResponse, {
      existenceCompareFields: [
        { path: 'products[*].specificationGroups', key: 'name' },
        {
          path: 'products[*].specificationGroups[*].specifications',
          key: 'name',
        },
        { path: 'products[*].properties', key: 'name' },
      ],
    })

    const ignoredDifferences: IgnoredDifference[] = [
      {
        path: 'products[*].specificationGroups[name:allSpecifications].specifications[name:sellerId]',
        type: 'extra_key',
      },
      { path: 'products[*].properties[name:sellerId]', type: 'extra_key' },
    ]

    const filtered = filterIgnoredDifferences(
      result.differences,
      ignoredDifferences
    )

    expect(filtered).toEqual([])
  })
})

describe('filterIgnoredDifferences', () => {
  describe('basic filtering', () => {
    it('should return all differences when no ignored differences are provided', () => {
      const differences: ObjectDifference[] = [
        {
          path: 'name',
          type: 'different_value',
          expected: 'John',
          actual: 'Jane',
        },
        { path: 'age', type: 'extra_key', expected: 25 },
      ]

      const result = filterIgnoredDifferences(differences, [])

      expect(result).toEqual(differences)
    })

    it('should return all differences when ignoredDifferences is undefined', () => {
      const differences: ObjectDifference[] = [
        {
          path: 'name',
          type: 'different_value',
          expected: 'John',
          actual: 'Jane',
        },
        { path: 'age', type: 'extra_key', expected: 25 },
      ]

      const result = filterIgnoredDifferences(differences)

      expect(result).toEqual(differences)
    })

    it('should filter out exact path and type matches', () => {
      const differences: ObjectDifference[] = [
        {
          path: 'name',
          type: 'different_value',
          expected: 'John',
          actual: 'Jane',
        },
        { path: 'age', type: 'extra_key', expected: 25 },
        { path: 'email', type: 'missing_key', actual: 'john@example.com' },
      ]

      const ignoredDifferences: IgnoredDifference[] = [
        { path: 'age', type: 'extra_key' },
        { path: 'email', type: 'missing_key' },
      ]

      const result = filterIgnoredDifferences(differences, ignoredDifferences)

      expect(result).toEqual([
        {
          path: 'name',
          type: 'different_value',
          expected: 'John',
          actual: 'Jane',
        },
      ])
    })

    it('should not filter out differences with same path but different type', () => {
      const differences: ObjectDifference[] = [
        {
          path: 'value',
          type: 'different_value',
          expected: 'John',
          actual: 'Jane',
        },
        {
          path: 'value',
          type: 'different_type',
          expected: 'string',
          actual: 'number',
        },
      ]

      const ignoredDifferences: IgnoredDifference[] = [
        { path: 'value', type: 'different_value' },
      ]

      const result = filterIgnoredDifferences(differences, ignoredDifferences)

      expect(result).toEqual([
        {
          path: 'value',
          type: 'different_type',
          expected: 'string',
          actual: 'number',
        },
      ])
    })

    it('should not filter out differences with same type but different path', () => {
      const differences: ObjectDifference[] = [
        { path: 'name', type: 'extra_key', expected: 'John' },
        { path: 'age', type: 'extra_key', expected: 25 },
      ]

      const ignoredDifferences: IgnoredDifference[] = [
        { path: 'name', type: 'extra_key' },
      ]

      const result = filterIgnoredDifferences(differences, ignoredDifferences)

      expect(result).toEqual([{ path: 'age', type: 'extra_key', expected: 25 }])
    })
  })

  describe('array path filtering', () => {
    it('should filter array index paths correctly', () => {
      const differences: ObjectDifference[] = [
        { path: '[0].productReferenceCode', type: 'extra_key', expected: null },
        { path: '[0].brandImageUrl', type: 'extra_key', expected: null },
        {
          path: '[1].productReference',
          type: 'different_value',
          expected: 'ABC',
          actual: 'DEF',
        },
      ]

      const ignoredDifferences: IgnoredDifference[] = [
        { path: '[0].productReferenceCode', type: 'extra_key' },
        { path: '[0].brandImageUrl', type: 'extra_key' },
      ]

      const result = filterIgnoredDifferences(differences, ignoredDifferences)

      expect(result).toEqual([
        {
          path: '[1].productReference',
          type: 'different_value',
          expected: 'ABC',
          actual: 'DEF',
        },
      ])
    })

    it('should handle nested array paths', () => {
      const differences: ObjectDifference[] = [
        { path: 'data[0].items[2].specs', type: 'missing_key', actual: {} },
        {
          path: 'data[1].categories[0]',
          type: 'different_value',
          expected: 'A',
          actual: 'B',
        },
      ]

      const ignoredDifferences: IgnoredDifference[] = [
        { path: 'data[0].items[2].specs', type: 'missing_key' },
      ]

      const result = filterIgnoredDifferences(differences, ignoredDifferences)

      expect(result).toEqual([
        {
          path: 'data[1].categories[0]',
          type: 'different_value',
          expected: 'A',
          actual: 'B',
        },
      ])
    })
  })

  describe('complex nested paths', () => {
    it('should filter deeply nested object paths', () => {
      const differences: ObjectDifference[] = [
        {
          path: 'user.profile.preferences.theme',
          type: 'different_value',
          expected: 'dark',
          actual: 'light',
        },
        {
          path: 'user.profile.avatar',
          type: 'extra_key',
          expected: 'avatar.jpg',
        },
        {
          path: 'user.settings.notifications',
          type: 'missing_key',
          actual: true,
        },
      ]

      const ignoredDifferences: IgnoredDifference[] = [
        { path: 'user.profile.avatar', type: 'extra_key' },
        { path: 'user.settings.notifications', type: 'missing_key' },
      ]

      const result = filterIgnoredDifferences(differences, ignoredDifferences)

      expect(result).toEqual([
        {
          path: 'user.profile.preferences.theme',
          type: 'different_value',
          expected: 'dark',
          actual: 'light',
        },
      ])
    })
  })

  describe('all difference types', () => {
    it('should handle all supported difference types', () => {
      const differences: ObjectDifference[] = [
        { path: 'missing', type: 'missing_key', actual: 'value' },
        { path: 'extra', type: 'extra_key', expected: 'value' },
        {
          path: 'different',
          type: 'different_value',
          expected: 'old',
          actual: 'new',
        },
        {
          path: 'type',
          type: 'different_type',
          expected: 'string',
          actual: 'number',
        },
        {
          path: 'array',
          type: 'array_length_mismatch',
          expected: 3,
          actual: 5,
        },
      ]

      const ignoredDifferences: IgnoredDifference[] = [
        { path: 'missing', type: 'missing_key' },
        { path: 'extra', type: 'extra_key' },
        { path: 'type', type: 'different_type' },
        { path: 'array', type: 'array_length_mismatch' },
      ]

      const result = filterIgnoredDifferences(differences, ignoredDifferences)

      expect(result).toEqual([
        {
          path: 'different',
          type: 'different_value',
          expected: 'old',
          actual: 'new',
        },
      ])
    })
  })

  describe('edge cases', () => {
    it('should handle empty differences array', () => {
      const differences: any[] = []
      const ignoredDifferences: IgnoredDifference[] = [
        { path: 'any', type: 'extra_key' },
      ]

      const result = filterIgnoredDifferences(differences, ignoredDifferences)

      expect(result).toEqual([])
    })

    it('should handle empty ignored differences array', () => {
      const differences: ObjectDifference[] = [
        {
          path: 'name',
          type: 'different_value',
          expected: 'John',
          actual: 'Jane',
        },
      ]

      const result = filterIgnoredDifferences(differences, [])

      expect(result).toEqual(differences)
    })

    it('should filter all differences when all are ignored', () => {
      const differences: ObjectDifference[] = [
        {
          path: 'name',
          type: 'different_value',
          expected: 'John',
          actual: 'Jane',
        },
        { path: 'age', type: 'extra_key', expected: 25 },
      ]

      const ignoredDifferences: IgnoredDifference[] = [
        { path: 'name', type: 'different_value' },
        { path: 'age', type: 'extra_key' },
      ]

      const result = filterIgnoredDifferences(differences, ignoredDifferences)

      expect(result).toEqual([])
    })
  })
})

describe('shouldIgnoreDifference', () => {
  describe('wildcard [*] matching', () => {
    it('should match [*] against numeric array indices', () => {
      const diff: ObjectDifference = {
        path: 'products[0].cacheId',
        type: 'different_value',
        expected: 'a',
        actual: 'b',
      }

      expect(
        shouldIgnoreDifference(diff, {
          path: 'products[*].cacheId',
          type: 'different_value',
        })
      ).toBe(true)
    })

    it('should NOT match [*] against named array indices (only numeric)', () => {
      const diff: ObjectDifference = {
        path: 'products[name:foo].cacheId',
        type: 'different_value',
        expected: 'a',
        actual: 'b',
      }

      // [*] only matches numeric indices like [0], [1], etc.
      expect(
        shouldIgnoreDifference(diff, {
          path: 'products[*].cacheId',
          type: 'different_value',
        })
      ).toBe(false)
    })

    it('should match multiple [*] wildcards', () => {
      const diff: ObjectDifference = {
        path: 'products[0].items[2].sellers[0].commertialOffer.PriceValidUntil',
        type: 'different_value',
        expected: 'a',
        actual: 'b',
      }

      expect(
        shouldIgnoreDifference(diff, {
          path: 'products[*].items[*].sellers[*].commertialOffer.PriceValidUntil',
          type: 'different_value',
        })
      ).toBe(true)
    })

    it('should not match when path structure differs', () => {
      const diff: ObjectDifference = {
        path: 'products[0].other.cacheId',
        type: 'different_value',
        expected: 'a',
        actual: 'b',
      }

      expect(
        shouldIgnoreDifference(diff, {
          path: 'products[*].cacheId',
          type: 'different_value',
        })
      ).toBe(false)
    })
  })

  describe('named index [name:X] matching', () => {
    it('should match literal [name:X] patterns', () => {
      const diff: ObjectDifference = {
        path: 'products[0].specificationGroups[name:allSpecifications].specifications[name:sellerId]',
        type: 'missing_key',
        actual: 'test',
      }

      expect(
        shouldIgnoreDifference(diff, {
          path: 'products[*].specificationGroups[name:allSpecifications].specifications[name:sellerId]',
          type: 'missing_key',
        })
      ).toBe(true)
    })

    it('should not match different named indices', () => {
      const diff: ObjectDifference = {
        path: 'products[0].specificationGroups[name:other]',
        type: 'missing_key',
        actual: 'test',
      }

      expect(
        shouldIgnoreDifference(diff, {
          path: 'products[*].specificationGroups[name:allSpecifications]',
          type: 'missing_key',
        })
      ).toBe(false)
    })
  })

  describe('optional type', () => {
    it('should ignore all types when type is omitted (object pattern)', () => {
      const diff1: ObjectDifference = {
        path: 'searchId',
        type: 'different_value',
        expected: 'a',
        actual: 'b',
      }

      const diff2: ObjectDifference = {
        path: 'searchId',
        type: 'missing_key',
        actual: 'b',
      }

      const pattern: IgnoredDifference = { path: 'searchId' }

      expect(shouldIgnoreDifference(diff1, pattern)).toBe(true)
      expect(shouldIgnoreDifference(diff2, pattern)).toBe(true)
    })

    it('should ignore all types when using a string pattern', () => {
      const diff1: ObjectDifference = {
        path: 'products[0].cacheId',
        type: 'different_value',
        expected: 'a',
        actual: 'b',
      }

      const diff2: ObjectDifference = {
        path: 'products[0].cacheId',
        type: 'extra_key',
        expected: 'a',
      }

      expect(shouldIgnoreDifference(diff1, 'products[*].cacheId')).toBe(true)
      expect(shouldIgnoreDifference(diff2, 'products[*].cacheId')).toBe(true)
    })

    it('should still filter by type when type is provided', () => {
      const diff: ObjectDifference = {
        path: 'searchId',
        type: 'different_type',
        expected: 'string',
        actual: 'number',
      }

      expect(
        shouldIgnoreDifference(diff, {
          path: 'searchId',
          type: 'different_value',
        })
      ).toBe(false)

      expect(
        shouldIgnoreDifference(diff, {
          path: 'searchId',
          type: 'different_type',
        })
      ).toBe(true)
    })
  })

  describe('exact path matching (backward compatibility)', () => {
    it('should still match exact paths', () => {
      const diff: ObjectDifference = {
        path: 'user.profile.avatar',
        type: 'extra_key',
        expected: 'avatar.jpg',
      }

      expect(
        shouldIgnoreDifference(diff, {
          path: 'user.profile.avatar',
          type: 'extra_key',
        })
      ).toBe(true)
    })

    it('should not match partial paths', () => {
      const diff: ObjectDifference = {
        path: 'user.profile.avatar.url',
        type: 'extra_key',
        expected: 'avatar.jpg',
      }

      expect(
        shouldIgnoreDifference(diff, {
          path: 'user.profile.avatar',
          type: 'extra_key',
        })
      ).toBe(false)
    })
  })
})

describe('filterIgnoredDifferences with wildcards', () => {
  it('should filter using wildcard patterns', () => {
    const differences: ObjectDifference[] = [
      {
        path: 'products[0].cacheId',
        type: 'different_value',
        expected: 'a',
        actual: 'b',
      },
      {
        path: 'products[1].cacheId',
        type: 'different_value',
        expected: 'c',
        actual: 'd',
      },
      {
        path: 'products[0].productName',
        type: 'different_value',
        expected: 'x',
        actual: 'y',
      },
    ]

    const ignoredDifferences: IgnoredDifference[] = [
      { path: 'products[*].cacheId', type: 'different_value' },
    ]

    const result = filterIgnoredDifferences(differences, ignoredDifferences)

    expect(result).toEqual([
      {
        path: 'products[0].productName',
        type: 'different_value',
        expected: 'x',
        actual: 'y',
      },
    ])
  })

  it('should support string patterns', () => {
    const differences: ObjectDifference[] = [
      {
        path: 'products[0].cacheId',
        type: 'different_value',
        expected: 'a',
        actual: 'b',
      },
      {
        path: 'products[0].cacheId',
        type: 'extra_key',
        expected: 'a',
      },
    ]

    const result = filterIgnoredDifferences(differences, [
      'products[*].cacheId',
    ])

    expect(result).toEqual([])
  })

  it('should handle mixed exact and wildcard patterns', () => {
    const differences: ObjectDifference[] = [
      { path: 'searchId', type: 'different_value', expected: 'a', actual: 'b' },
      {
        path: 'products[0].items[1].sellers[0].commertialOffer.PriceValidUntil',
        type: 'different_value',
        expected: 'a',
        actual: 'b',
      },
      {
        path: 'products[0].productName',
        type: 'different_value',
        expected: 'x',
        actual: 'y',
      },
    ]

    const ignoredDifferences: IgnoredDifference[] = [
      { path: 'searchId', type: 'different_value' },
      {
        path: 'products[*].items[*].sellers[*].commertialOffer.PriceValidUntil',
        type: 'different_value',
      },
    ]

    const result = filterIgnoredDifferences(differences, ignoredDifferences)

    expect(result).toEqual([
      {
        path: 'products[0].productName',
        type: 'different_value',
        expected: 'x',
        actual: 'y',
      },
    ])
  })
})

describe('compareApiResults', () => {
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    account: '',
    workspace: '',
    operationId: '',
    requestId: '',
    traceId: '',
    transactionId: '',
    config: {},
    child: jest.fn(),
    addTags: jest.fn(),
  } as unknown as Logger

  let originalMathRandom: () => number

  beforeAll(() => {
    // Store original Math.random
    originalMathRandom = Math.random
  })

  afterAll(() => {
    // Restore original Math.random
    Math.random = originalMathRandom
  })

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset Math.random to original implementation
    Math.random = originalMathRandom
  })

  describe('sampling functionality', () => {
    it('should only call func1 when sample is 0', async () => {
      const func1 = jest.fn().mockResolvedValue('result1')
      const func2 = jest.fn().mockResolvedValue('result2')

      const result = await compareApiResults(func1, func2, 0, mockLogger)

      expect(func1).toHaveBeenCalledTimes(1)
      expect(func2).not.toHaveBeenCalled()
      expect(result).toBe('result1')
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it('should call both functions when sample is 100', async () => {
      const func1 = jest.fn().mockResolvedValue('result1')
      const func2 = jest.fn().mockResolvedValue('result1')

      const result = await compareApiResults(func1, func2, 100, mockLogger)

      expect(func1).toHaveBeenCalledTimes(1)
      expect(func2).toHaveBeenCalledTimes(1)
      expect(result).toBe('result1')
    })

    it('should only call func1 when Math.random indicates not in sample', async () => {
      // Mock Math.random to return 0.6 (60%), which should be >= 50% sample
      jest.spyOn(Math, 'random').mockImplementation().mockReturnValue(0.6)

      const func1 = jest.fn().mockResolvedValue('result1')
      const func2 = jest.fn().mockResolvedValue('result2')

      // 50% sample rate, but random returns 60%, so should not be in sample
      const result = await compareApiResults(func1, func2, 50, mockLogger)

      expect(func1).toHaveBeenCalledTimes(1)
      expect(func2).not.toHaveBeenCalled()
      expect(result).toBe('result1')
    })

    it('should call both functions when Math.random indicates in sample', async () => {
      // Mock Math.random to return 0.3 (30%), which should be < 50% sample
      jest.spyOn(Math, 'random').mockImplementation().mockReturnValue(0.3)

      const func1 = jest.fn().mockResolvedValue('result1')
      const func2 = jest.fn().mockResolvedValue('result1')

      // 50% sample rate, and random returns 30%, so should be in sample
      const result = await compareApiResults(func1, func2, 50, mockLogger)

      expect(func1).toHaveBeenCalledTimes(1)
      expect(func2).toHaveBeenCalledTimes(1)
      expect(result).toBe('result1')
    })
  })

  describe('comparison logic when in sample', () => {
    beforeEach(() => {
      // Always be in sample for these tests
      jest.spyOn(Math, 'random').mockImplementation().mockReturnValue(0.1)
    })

    it('should return result1 when both functions succeed and results are equal', async () => {
      const func1 = jest.fn().mockResolvedValue({ data: 'test' })
      const func2 = jest.fn().mockResolvedValue({ data: 'test' })

      const result = await compareApiResults(func1, func2, 100, mockLogger)

      expect(result).toEqual({ data: 'test' })
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it('should log error when results differ', async () => {
      const func1 = jest.fn().mockResolvedValue({ data: 'test1' })
      const func2 = jest.fn().mockResolvedValue({ data: 'test2' })

      const result = await compareApiResults(func1, func2, 100, mockLogger, {
        args: { query: 'test' },
        logPrefix: 'Test API',
      })

      expect(result).toEqual({ data: 'test1' })
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Test API: Results differ',
        params: JSON.stringify({ query: 'test' }),
        differences: [
          {
            path: 'data',
            type: 'different_value',
            expected: 'test1',
            actual: 'test2',
          },
        ],
        differenceCount: 1,
        totalDifferences: 1,
        ignoredDifferences: 0,
      })
    })

    it('should return result2 when func1 errors but func2 succeeds', async () => {
      const func1 = jest.fn().mockRejectedValue(new Error('func1 error'))
      const func2 = jest.fn().mockResolvedValue({ data: 'test2' })

      const result = await compareApiResults(func1, func2, 100, mockLogger)

      expect(result).toEqual({ data: 'test2' })
    })

    it('should throw error when both functions fail', async () => {
      const func1 = jest.fn().mockRejectedValue(new Error('func1 error'))
      const func2 = jest.fn().mockRejectedValue(new Error('func2 error'))

      await expect(
        compareApiResults(func1, func2, 100, mockLogger)
      ).rejects.toThrow('Both calls resulted in errors')
    })
  })

  describe('ignored differences functionality', () => {
    beforeEach(() => {
      // Always be in sample for these tests
      jest.spyOn(Math, 'random').mockImplementation().mockReturnValue(0.1)
    })

    it('should consider results equal when all differences are ignored', async () => {
      const func1 = jest.fn().mockResolvedValue({
        name: 'John',
        age: 25,
        extra: 'field',
      })

      const func2 = jest.fn().mockResolvedValue({
        name: 'Jane',
        age: 30,
      })

      const ignoredDifferences: IgnoredDifference[] = [
        { path: 'name', type: 'different_value' },
        { path: 'age', type: 'different_value' },
        { path: 'extra', type: 'extra_key' },
      ]

      const result = await compareApiResults(func1, func2, 100, mockLogger, {
        ignoredDifferences,
        logPrefix: 'Test API',
      })

      expect(result).toEqual({ name: 'John', age: 25, extra: 'field' })
      expect(mockLogger.error).not.toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Test API: Results are equal',
        params: undefined,
        totalDifferences: 3,
        ignoredDifferences: 3,
      })
    })

    it('should log differences after filtering out ignored ones', async () => {
      const func1 = jest.fn().mockResolvedValue([
        {
          productReferenceCode: null,
          brandImageUrl: null,
          name: 'Product A',
          price: 100,
        },
      ])

      const func2 = jest.fn().mockResolvedValue([
        {
          name: 'Product B',
          price: 150,
        },
      ])

      const ignoredDifferences: IgnoredDifference[] = [
        { path: '[0].productReferenceCode', type: 'extra_key' },
        { path: '[0].brandImageUrl', type: 'extra_key' },
      ]

      const result = await compareApiResults(func1, func2, 100, mockLogger, {
        ignoredDifferences,
        args: { query: 'test product' },
        logPrefix: 'Product API',
      })

      expect(result).toEqual([
        {
          productReferenceCode: null,
          brandImageUrl: null,
          name: 'Product A',
          price: 100,
        },
      ])

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Product API: Results differ',
        params: JSON.stringify({ query: 'test product' }),
        differences: [
          {
            path: '[0].name',
            type: 'different_value',
            expected: 'Product A',
            actual: 'Product B',
          },
          {
            path: '[0].price',
            type: 'different_value',
            expected: 100,
            actual: 150,
          },
        ],
        differenceCount: 2,
        totalDifferences: 4,
        ignoredDifferences: 2,
      })
    })

    it('should work with complex nested paths as in the example', async () => {
      const func1 = jest.fn().mockResolvedValue([
        {
          productReferenceCode: null,
          brandImageUrl: null,
          releaseDate: '2023-12-01',
          clusterHighlights: { '259': 'Solução Completa' },
          productClusters: { '260': 'Campanha' },
          searchableClusters: {
            '259': 'Solução Completa',
            '260': 'Campanha Pais Colaborador',
          },
          categories: [
            '/Segurança eletrônica/Câmeras de segurança/Câmeras Wi-fi/',
          ],
          categoriesIds: ['/2/33/101/'],
        },
      ])

      const func2 = jest.fn().mockResolvedValue([
        {
          releaseDate: 1702857600,
          clusterHighlights: ['Solução Completa'],
          productClusters: ['Campanha'],
          categories: ['/Segurança eletrônica/'],
          categoriesIds: ['2'],
        },
      ])

      const ignoredDifferences: IgnoredDifference[] = [
        { path: '[0].productReferenceCode', type: 'extra_key' },
        { path: '[0].brandImageUrl', type: 'extra_key' },
        { path: '[0].searchableClusters', type: 'extra_key' },
        { path: '[0].releaseDate', type: 'different_type' },
        { path: '[0].clusterHighlights', type: 'different_type' },
        { path: '[0].productClusters', type: 'different_type' },
      ]

      const result = await compareApiResults(func1, func2, 100, mockLogger, {
        ignoredDifferences,
        logPrefix: 'Complex Product API',
      })

      expect(result).toBeDefined()
      // Should still log errors for categories and categoriesIds differences
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Complex Product API: Results differ',
          differenceCount: 2, // Only categories and categoriesIds differences remain
          totalDifferences: 8, // Total before filtering
          ignoredDifferences: 6, // Number filtered out
        })
      )
    })

    it('should handle empty ignored differences array', async () => {
      const func1 = jest.fn().mockResolvedValue({ name: 'John' })
      const func2 = jest.fn().mockResolvedValue({ name: 'Jane' })

      const result = await compareApiResults(func1, func2, 100, mockLogger, {
        ignoredDifferences: [],
      })

      expect(result).toEqual({ name: 'John' })
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should handle undefined ignored differences', async () => {
      const func1 = jest.fn().mockResolvedValue({ name: 'John' })
      const func2 = jest.fn().mockResolvedValue({ name: 'Jane' })

      const result = await compareApiResults(func1, func2, 100, mockLogger, {
        // No ignoredDifferences property
      })

      expect(result).toEqual({ name: 'John' })
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should handle mixed difference types in ignored differences', async () => {
      const func1 = jest.fn().mockResolvedValue({
        user: {
          name: 'John',
          avatar: 'avatar.jpg',
          settings: { theme: 'dark' },
        },
        items: [1, 2, 3],
      })

      const func2 = jest.fn().mockResolvedValue({
        user: {
          name: 'John',
          settings: { theme: 'light', notifications: true },
        },
        items: [1, 2],
      })

      const ignoredDifferences: IgnoredDifference[] = [
        { path: 'user.avatar', type: 'extra_key' },
        { path: 'user.settings.notifications', type: 'missing_key' },
        { path: 'items', type: 'array_length_mismatch' },
        { path: 'items[2]', type: 'extra_key' },
      ]

      const result = await compareApiResults(func1, func2, 100, mockLogger, {
        ignoredDifferences,
        logPrefix: 'Mixed Types API',
      })

      expect(result).toBeDefined()
      // Should still have one difference for theme
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Mixed Types API: Results differ',
          differenceCount: 1, // Only theme difference remains
          totalDifferences: 5, // Total before filtering
          ignoredDifferences: 4, // Number filtered out
        })
      )
    })
  })
})
