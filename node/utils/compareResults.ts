import type { Logger } from '@vtex/api'

export const NO_TRAFFIC = 0

/**
 * Utility to compare the results of two functions in parallel
 * Used primarily for comparing the results of two API implementations
 * during the migration from intelligent-search-api to intsch
 */

/**
 * Represents a difference found between two values
 */
export interface ObjectDifference {
  path: string
  type:
    | 'missing_key'
    | 'extra_key'
    | 'different_value'
    | 'different_type'
    | 'array_length_mismatch'
  expected?: unknown
  actual?: unknown
  details?: string
}

/**
 * Result of deep comparison with differences
 */
export interface DeepComparisonResult {
  isEqual: boolean
  differences: ObjectDifference[]
}

/**
 * Finds differences between two values recursively
 * @param a First value to compare
 * @param b Second value to compare
 * @param path Current path in the object (for tracking location of differences)
 * @param maxDepth Maximum recursion depth (default: 20)
 * @param currentDepth Current recursion depth (internal use)
 * @returns Array of differences found
 */
export function findDifferences(
  a: unknown,
  b: unknown,
  path = '',
  maxDepth = 50,
  currentDepth = 0
): ObjectDifference[] {
  const differences: ObjectDifference[] = []

  // If both values are exactly the same, no differences
  if (a === b) return differences

  // Check for null values or different types
  if (a === null || b === null || typeof a !== typeof b) {
    differences.push({
      path,
      type: 'different_type',
      expected: a === null ? 'null' : typeof a,
      actual: b === null ? 'null' : typeof b,
    })

    return differences
  }

  // If neither is an object, they are different primitive values
  if (typeof a !== 'object' || typeof b !== 'object') {
    differences.push({
      path,
      type: 'different_value',
      expected: a,
      actual: b,
    })

    return differences
  }

  // Check if maximum recursion depth has been reached (only for objects)
  if (currentDepth > maxDepth) {
    // When max depth is reached, consider values equal (original behavior)
    return differences
  }

  // Handle arrays specially
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      differences.push({
        path,
        type: 'array_length_mismatch',
        expected: a.length,
        actual: b.length,
      })
    }

    const maxLength = Math.max(a.length, b.length)

    for (let i = 0; i < maxLength; i++) {
      const currentPath = path ? `${path}[${i}]` : `[${i}]`

      if (i >= a.length) {
        differences.push({
          path: currentPath,
          type: 'missing_key',
          actual: b[i],
        })
      } else if (i >= b.length) {
        differences.push({
          path: currentPath,
          type: 'extra_key',
          expected: a[i],
        })
      } else {
        differences.push(
          ...findDifferences(
            a[i],
            b[i],
            currentPath,
            maxDepth,
            currentDepth + 1
          )
        )
      }
    }

    return differences
  }

  // If one is an array but the other isn't
  if (Array.isArray(a) !== Array.isArray(b)) {
    differences.push({
      path,
      type: 'different_type',
      expected: Array.isArray(a) ? 'array' : 'object',
      actual: Array.isArray(b) ? 'array' : 'object',
    })

    return differences
  }

  // Cast to Record<string, unknown> for type safety
  const objA = a as Record<string, unknown>
  const objB = b as Record<string, unknown>

  // Compare object keys
  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)
  const allKeys = new Set([...keysA, ...keysB])

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key
    const hasKeyA = Object.prototype.hasOwnProperty.call(objA, key)
    const hasKeyB = Object.prototype.hasOwnProperty.call(objB, key)

    if (hasKeyA && !hasKeyB) {
      differences.push({
        path: currentPath,
        type: 'extra_key',
        expected: objA[key],
      })
    } else if (!hasKeyA && hasKeyB) {
      differences.push({
        path: currentPath,
        type: 'missing_key',
        actual: objB[key],
      })
    } else if (hasKeyA && hasKeyB) {
      differences.push(
        ...findDifferences(
          objA[key],
          objB[key],
          currentPath,
          maxDepth,
          currentDepth + 1
        )
      )
    }
  }

  return differences
}

/**
 * Performs a deep equality comparison between two values
 * @param a First value to compare
 * @param b Second value to compare
 * @param maxDepth Maximum recursion depth (default: 20)
 * @returns DeepComparisonResult with isEqual boolean and differences array
 */
export function isDeepEqual(
  a: unknown,
  b: unknown,
  maxDepth = 20
): DeepComparisonResult {
  const differences = findDifferences(a, b, '', maxDepth, 0)

  return {
    isEqual: differences.length === 0,
    differences,
  }
}

/**
 * Filters out differences that should be ignored based on path and type
 * @param differences Array of differences to filter
 * @param ignoredDifferences Array of ignored difference configurations
 * @returns Filtered array of differences
 */
export function filterIgnoredDifferences(
  differences: ObjectDifference[],
  ignoredDifferences: IgnoredDifference[] = []
): ObjectDifference[] {
  if (ignoredDifferences.length === 0) {
    return differences
  }

  return differences.filter((difference) => {
    // Check if this difference should be ignored
    return !ignoredDifferences.some(
      (ignored) =>
        ignored.path === difference.path && ignored.type === difference.type
    )
  })
}

/**
 * Configuration for ignoring expected differences
 */
export interface IgnoredDifference {
  path: string
  type:
    | 'missing_key'
    | 'extra_key'
    | 'different_value'
    | 'different_type'
    | 'array_length_mismatch'
}

/**
 * Options for the compareApiResults function
 */
export interface CompareApiResultsOptions {
  args?: unknown
  logPrefix?: string
  ignoredDifferences?: IgnoredDifference[]
}

/**
 * Executes two functions in parallel and compares their results
 * @param func1 First function to execute
 * @param func2 Second function to execute
 * @param sample Percentage of traffic that should execute the comparison (0-100)
 * @param logger Logger instance to use for logging
 * @param options Configuration options
 * @returns Promise with a result object containing the results and comparison details
 */
export async function compareApiResults<T>(
  func1: () => Promise<T>,
  func2: () => Promise<T>,
  sample: number,
  logger: Logger,
  options: CompareApiResultsOptions = {}
): Promise<T> {
  const { logPrefix = 'API Comparison', ignoredDifferences = [] } = options

  // Check if we should perform comparison based on sample percentage
  const shouldCompare = Math.random() * 100 < sample

  if (!shouldCompare) {
    // If not in sample, just execute func1 and return its result
    return func1()
  }

  // Execute both functions in parallel
  const [result1, result2] = await Promise.all([
    func1().catch((error) => ({ __error: error })),
    func2().catch((error) => ({ __error: error })),
  ])

  // Check if either function resulted in an error
  const hasError1 =
    result1 && typeof result1 === 'object' && '__error' in result1

  const hasError2 =
    result2 && typeof result2 === 'object' && '__error' in result2

  let areEqual = false
  let differences: ObjectDifference[] = []
  let filteredDifferences: ObjectDifference[] = []

  try {
    if (!hasError1 && !hasError2) {
      const comparisonResult = isDeepEqual(result1, result2)

      differences = comparisonResult.differences
      filteredDifferences = filterIgnoredDifferences(
        differences,
        ignoredDifferences
      )
      areEqual = filteredDifferences.length === 0
    }
  } catch (error) {
    logger.error({
      message: `${logPrefix}: Error during deep comparison`,
      error,
    })
  }

  if (!areEqual && !hasError1 && !hasError2) {
    logger.error({
      message: `${logPrefix}: Results differ`,
      params: JSON.stringify(options.args),
      differences: filteredDifferences.slice(0, 10), // Limit to first 10 differences to avoid log overflow
      differenceCount: filteredDifferences.length,
      totalDifferences: differences.length,
      ignoredDifferences: differences.length - filteredDifferences.length,
    })
  } else if (areEqual) {
    logger.info({
      //  Since the log level is indexed we are using it to get a sense of the % of results that are equal.
      message: `${logPrefix}: Results are equal`,
      params: JSON.stringify(options.args),
      totalDifferences: differences.length,
      ignoredDifferences: differences.length - filteredDifferences.length,
    })
  }

  if (!hasError1) {
    return result1 as T
  }

  if (hasError1 && !hasError2) {
    return result2 as T
  }

  throw Error('Both calls resulted in errors')
}
