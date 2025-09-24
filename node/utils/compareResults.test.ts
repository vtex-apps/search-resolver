import type { Logger } from '@vtex/api'

import {
  isDeepEqual,
  compareApiResults,
  findDifferences,
} from './compareResults'

describe('isDeepEqual', () => {
  // Basic equality tests
  describe('basic equality', () => {
    it('should return true for identical primitive values', () => {
      expect(isDeepEqual(1, 1)).toBe(true)
      expect(isDeepEqual('hello', 'hello')).toBe(true)
      expect(isDeepEqual(true, true)).toBe(true)
      expect(isDeepEqual(null, null)).toBe(true)
      expect(isDeepEqual(undefined, undefined)).toBe(true)
    })

    it('should return false for different primitive values', () => {
      expect(isDeepEqual(1, 2)).toBe(false)
      expect(isDeepEqual('hello', 'world')).toBe(false)
      expect(isDeepEqual(true, false)).toBe(false)
      expect(isDeepEqual(null, undefined)).toBe(false)
      expect(isDeepEqual(0, null)).toBe(false)
      expect(isDeepEqual('', null)).toBe(false)
    })

    it('should handle empty arrays and objects', () => {
      expect(isDeepEqual([], [])).toBe(true)
      expect(isDeepEqual({}, {})).toBe(true)
      expect(isDeepEqual([], {})).toBe(false)
    })
  })

  // Simple objects and arrays tests
  describe('simple objects and arrays', () => {
    it('should compare simple arrays correctly', () => {
      expect(isDeepEqual([1, 2, 3], [1, 2, 3])).toBe(true)
      expect(isDeepEqual([1, 2, 3], [1, 2, 4])).toBe(false)
      expect(isDeepEqual([1, 2], [1, 2, 3])).toBe(false)
    })

    it('should compare simple objects correctly', () => {
      expect(isDeepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
      expect(isDeepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false)
      expect(isDeepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
      expect(isDeepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true) // order doesn't matter
    })

    it('should handle arrays with objects', () => {
      expect(isDeepEqual([{ a: 1 }], [{ a: 1 }])).toBe(true)
      expect(isDeepEqual([{ a: 1 }], [{ a: 2 }])).toBe(false)
    })

    it('should handle objects with arrays', () => {
      expect(isDeepEqual({ a: [1, 2] }, { a: [1, 2] })).toBe(true)
      expect(isDeepEqual({ a: [1, 2] }, { a: [1, 3] })).toBe(false)
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

      expect(isDeepEqual(obj1, obj2)).toBe(true)
      expect(isDeepEqual(obj1, obj3)).toBe(false)
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

      expect(isDeepEqual(arr1, arr2)).toBe(true)
      expect(isDeepEqual(arr1, arr3)).toBe(false)
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
      expect(isDeepEqual(obj1, obj2)).toBe(true)
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
      expect(isDeepEqual(deepObj1, deepObj2)).toBe(false)

      // With depth of 3, the difference at level4 should not be detected
      expect(isDeepEqual(deepObj1, deepObj2, 3)).toBe(true)

      // With depth of 4, the difference should be detected
      expect(isDeepEqual(deepObj1, deepObj2, 4)).toBe(false)
    })

    it('should respect the maxDepth parameter for nested arrays', () => {
      const nestedArray1 = [1, [2, [3, [4, [5, 6]]]]]
      const nestedArray2 = [1, [2, [3, [4, [5, 7]]]]]

      // With default depth, the difference should be detected
      expect(isDeepEqual(nestedArray1, nestedArray2)).toBe(false)

      // With depth of 4, the difference at the deepest level should not be detected
      expect(isDeepEqual(nestedArray1, nestedArray2, 3)).toBe(true)

      // With depth of 5, the difference should be detected
      expect(isDeepEqual(nestedArray1, nestedArray2, 4)).toBe(false)
    })
  })

  describe('difference detection', () => {
    it('should return differences when using returnDifferences option', () => {
      const obj1 = { name: 'John', age: 25 }
      const obj2 = { name: 'Jane', age: 30 }

      const result = isDeepEqual(obj1, obj2, { returnDifferences: true })

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

      const result = isDeepEqual(obj1, obj2, { returnDifferences: true })

      expect(result.isEqual).toBe(true)
      expect(result.differences).toHaveLength(0)
    })

    it('should detect missing and extra keys', () => {
      const obj1 = { name: 'John', age: 25 }
      const obj2 = { name: 'John', email: 'john@example.com' }

      const result = isDeepEqual(obj1, obj2, { returnDifferences: true })

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

      const result = isDeepEqual(obj1, obj2, { returnDifferences: true })

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

      const result = isDeepEqual(arr1, arr2, { returnDifferences: true })

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

      const result = isDeepEqual(obj1, obj2, { returnDifferences: true })

      expect(result.isEqual).toBe(false)
      expect(result.differences).toHaveLength(1)
      expect(result.differences![0]).toEqual({
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

    const differences = findDifferences(deep1, deep2, '', 2)

    expect(differences).toHaveLength(0) // Should not find differences beyond maxDepth
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
        result1: { data: 'test1' },
        result2: { data: 'test2' },
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
})
