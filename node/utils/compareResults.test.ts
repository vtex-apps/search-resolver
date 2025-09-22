import type { Logger } from '@vtex/api'

import { isDeepEqual, compareApiResults } from './compareResults'

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

      const result = await compareApiResults(func1, func2, 0, {}, mockLogger)

      expect(func1).toHaveBeenCalledTimes(1)
      expect(func2).not.toHaveBeenCalled()
      expect(result).toBe('result1')
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it('should call both functions when sample is 100', async () => {
      const func1 = jest.fn().mockResolvedValue('result1')
      const func2 = jest.fn().mockResolvedValue('result1')

      const result = await compareApiResults(func1, func2, 100, {}, mockLogger)

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
      const result = await compareApiResults(func1, func2, 50, {}, mockLogger)

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
      const result = await compareApiResults(func1, func2, 50, {}, mockLogger)

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

      const result = await compareApiResults(func1, func2, 100, {}, mockLogger)

      expect(result).toEqual({ data: 'test' })
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it('should log error when results differ', async () => {
      const func1 = jest.fn().mockResolvedValue({ data: 'test1' })
      const func2 = jest.fn().mockResolvedValue({ data: 'test2' })

      const result = await compareApiResults(
        func1,
        func2,
        100,
        { args: { query: 'test' }, logPrefix: 'Test API' },
        mockLogger
      )

      expect(result).toEqual({ data: 'test1' })
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Test API: Results differ',
        params: JSON.stringify({ query: 'test' }),
      })
    })

    it('should return result2 when func1 errors but func2 succeeds', async () => {
      const func1 = jest.fn().mockRejectedValue(new Error('func1 error'))
      const func2 = jest.fn().mockResolvedValue({ data: 'test2' })

      const result = await compareApiResults(func1, func2, 100, {}, mockLogger)

      expect(result).toEqual({ data: 'test2' })
    })

    it('should throw error when both functions fail', async () => {
      const func1 = jest.fn().mockRejectedValue(new Error('func1 error'))
      const func2 = jest.fn().mockRejectedValue(new Error('func2 error'))

      await expect(
        compareApiResults(func1, func2, 100, {}, mockLogger)
      ).rejects.toThrow('Both calls resulted in errors')
    })
  })
})
