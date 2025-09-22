import type { Logger } from '@vtex/api'

/**
 * Utility to compare the results of two functions in parallel
 * Used primarily for comparing the results of two API implementations
 * during the migration from intelligent-search-api to intsch
 */

/**
 * Performs a deep equality comparison between two values
 * @param a First value to compare
 * @param b Second value to compare
 * @param maxDepth Maximum recursion depth (default: 20)
 * @param currentDepth Current recursion depth (internal use)
 * @returns boolean indicating if the values are deeply equal
 */
export function isDeepEqual(
  a: unknown,
  b: unknown,
  maxDepth = 20,
  currentDepth = 0
): boolean {
  // If both values are exactly the same, they are equal
  if (a === b) return true

  // If either value is null or not an object, they can only be equal if they are strictly equal (handled above)
  if (
    a === null ||
    b === null ||
    typeof a !== 'object' ||
    typeof b !== 'object'
  )
    return false

  // Check if maximum recursion depth has been reached
  if (currentDepth > maxDepth) return true

  // Handle arrays specially
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false

    // Check if all items in arrays are deeply equal
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i], maxDepth, currentDepth + 1)) return false
    }

    return true
  }

  // If one is an array but the other isn't, they are not equal
  if (Array.isArray(a) !== Array.isArray(b)) return false

  // Cast to Record<string, unknown> for type safety
  const objA = a as Record<string, unknown>
  const objB = b as Record<string, unknown>

  // Compare object keys
  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) return false

  // Check if all keys in a exist in b and have the same values
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key)) return false
    if (!isDeepEqual(objA[key], objB[key], maxDepth, currentDepth + 1)) {
      return false
    }
  }

  return true
}

/**
 * Options for the compareApiResults function
 */
export interface CompareApiResultsOptions {
  args?: unknown
  logPrefix?: string
}

/**
 * Executes two functions in parallel and compares their results
 * @param func1 First function to execute
 * @param func2 Second function to execute
 * @param options Configuration options
 * @param logger Logger instance to use for logging
 * @returns Promise with a result object containing the results and comparison details
 */
export async function compareApiResults<T>(
  func1: () => Promise<T>,
  func2: () => Promise<T>,
  options: CompareApiResultsOptions = {},
  logger: Logger
): Promise<T> {
  const { logPrefix = 'API Comparison' } = options

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

  try {
    areEqual = !hasError1 && !hasError2 && isDeepEqual(result1, result2)
  } catch (error) {
    logger.error({
      message: `${logPrefix}: Error during deep comparison`,
      error,
    })
  }

  if (!areEqual) {
    logger.error({
      message: `${logPrefix}: Results differ`,
      params: JSON.stringify(options.args),
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
