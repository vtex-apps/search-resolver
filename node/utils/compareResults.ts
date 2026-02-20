import type { Logger } from '@vtex/api'

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
    | 'null_mismatch'
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
 * Pattern for matching fields that should use existence-based (key-based)
 * comparison instead of position-based comparison.
 * Can be a simple field name (e.g. 'specifications') or a path pattern
 * with wildcards (e.g. 'facets[*].values').
 * Can also be an object with a custom key property for element matching.
 */
export type ExistenceComparePattern = string | { path: string; key?: string }

/**
 * Options for the findDifferences function
 */
export interface FindDifferencesOptions {
  maxDepth?: number
  existenceCompareFields?: ExistenceComparePattern[]
}

/**
 * Helper to extract a unique key from an array element for existence-based comparison.
 * Tries common key properties: id, key, name, originalName, value, field.name.
 * For primitives (strings, numbers), uses the value itself.
 */
function getElementKey(element: unknown): string | null {
  if (typeof element === 'string' || typeof element === 'number') {
    return String(element)
  }

  if (!element || typeof element !== 'object') {
    return null
  }

  const obj = element as Record<string, unknown>
  // Use || (not ??) to match intelligent-search: skip falsy values like "" and 0
  const key =
    obj.id ||
    obj.key ||
    obj.name ||
    obj.originalName ||
    obj.value ||
    (obj.field &&
      typeof obj.field === 'object' &&
      (obj.field as Record<string, unknown>).name)

  return key != null ? String(key) : null
}

/**
 * Check if a given path matches an existence comparison pattern.
 * Supports simple field names and wildcard patterns like 'facets[*].values'.
 */
function matchesExistencePattern(path: string, pattern: string): boolean {
  // Simple field name match (no dots or brackets in pattern)
  if (!pattern.includes('.') && !pattern.includes('[')) {
    const parts = path.split('.')
    let fieldName = parts[parts.length - 1] || ''

    fieldName = fieldName.replace(/\[\d+\]/, '').replace(/\[name:.*?\]/, '')

    return fieldName === pattern
  }

  // Escape all regex special characters first, then un-escape wildcard tokens
  let regexPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  regexPattern = regexPattern.replace(
    /\\\[\\\*\\\]/g,
    '(?:\\[\\d+\\]|\\[name:[^\\]]+\\])'
  )

  regexPattern = regexPattern.replace(/\\\*/g, '[^.\\[\\]]*')

  const regex = new RegExp(`^${regexPattern}$`)

  return regex.test(path)
}

/**
 * Find the first matching existence pattern for a given path.
 */
function findMatchingExistencePattern(
  path: string,
  patterns: ExistenceComparePattern[]
): { pattern: string; key: string | null } | null {
  for (const patternConfig of patterns) {
    const patternPath =
      typeof patternConfig === 'string' ? patternConfig : patternConfig.path

    const customKey =
      typeof patternConfig === 'string' ? null : patternConfig.key ?? null

    if (matchesExistencePattern(path, patternPath)) {
      return { pattern: patternPath, key: customKey }
    }
  }

  return null
}

/**
 * Compare arrays by existence (key-based) rather than by position.
 * Elements are matched by a key extracted from each element (id, name, etc.).
 * Elements without a key fall back to positional comparison.
 */
function compareArraysByExistence(
  arr1: unknown[],
  arr2: unknown[],
  path: string,
  customKey: string | null,
  options: FindDifferencesOptions,
  currentDepth: number
): ObjectDifference[] {
  const differences: ObjectDifference[] = []

  const extractKey = (item: unknown): string | null => {
    if (customKey) {
      if (typeof item === 'object' && item !== null) {
        const keys = customKey.split('.')
        let value: unknown = item

        for (const k of keys) {
          if (
            value &&
            typeof value === 'object' &&
            k in (value as Record<string, unknown>)
          ) {
            value = (value as Record<string, unknown>)[k]
          } else {
            return null
          }
        }

        return value != null ? String(value) : null
      }

      return null
    }

    return getElementKey(item)
  }

  const map1 = new Map<string, unknown>()
  const map2 = new Map<string, unknown>()
  const itemsWithoutKey1: Array<{ index: number; item: unknown }> = []
  const itemsWithoutKey2: Array<{ index: number; item: unknown }> = []

  for (let i = 0; i < arr1.length; i++) {
    const key = extractKey(arr1[i])

    if (key) {
      map1.set(key, arr1[i])
    } else {
      itemsWithoutKey1.push({ index: i, item: arr1[i] })
    }
  }

  for (let i = 0; i < arr2.length; i++) {
    const key = extractKey(arr2[i])

    if (key) {
      map2.set(key, arr2[i])
    } else {
      itemsWithoutKey2.push({ index: i, item: arr2[i] })
    }
  }

  // Compare items without keys by position (fallback)
  const maxNoKeyLength = Math.max(
    itemsWithoutKey1.length,
    itemsWithoutKey2.length
  )

  for (let i = 0; i < maxNoKeyLength; i++) {
    const currentPath = path ? `${path}[no-name:${i}]` : `[no-name:${i}]`

    if (i >= itemsWithoutKey1.length) {
      differences.push({
        path: currentPath,
        type: 'missing_key',
        actual: itemsWithoutKey2[i].item,
      })
    } else if (i >= itemsWithoutKey2.length) {
      differences.push({
        path: currentPath,
        type: 'extra_key',
        expected: itemsWithoutKey1[i].item,
      })
    } else {
      differences.push(
        ...findDifferences(
          itemsWithoutKey1[i].item,
          itemsWithoutKey2[i].item,
          currentPath,
          options,
          currentDepth + 1
        )
      )
    }
  }

  // Find elements in arr2 not in arr1 (missing from expected)
  for (const [key, item] of map2) {
    if (!map1.has(key)) {
      const currentPath = path ? `${path}[name:${key}]` : `[name:${key}]`

      differences.push({
        path: currentPath,
        type: 'missing_key',
        actual: item,
      })
    }
  }

  // Find elements in arr1 not in arr2 (extra in expected)
  for (const [key, item] of map1) {
    if (!map2.has(key)) {
      const currentPath = path ? `${path}[name:${key}]` : `[name:${key}]`

      differences.push({
        path: currentPath,
        type: 'extra_key',
        expected: item,
      })
    }
  }

  // Compare elements that exist in both arrays
  for (const [key, item1] of map1) {
    if (map2.has(key)) {
      const item2 = map2.get(key)
      const currentPath = path ? `${path}[name:${key}]` : `[name:${key}]`

      differences.push(
        ...findDifferences(item1, item2, currentPath, options, currentDepth + 1)
      )
    }
  }

  return differences
}

/**
 * Finds differences between two values recursively
 * @param a First value to compare
 * @param b Second value to compare
 * @param path Current path in the object (for tracking location of differences)
 * @param options Comparison options (maxDepth, existenceCompareFields)
 * @param currentDepth Current recursion depth (internal use)
 * @returns Array of differences found
 */
export function findDifferences(
  a: unknown,
  b: unknown,
  path = '',
  options: FindDifferencesOptions = {},
  currentDepth = 0
): ObjectDifference[] {
  const differences: ObjectDifference[] = []

  // If both values are exactly the same, no differences
  if (a === b) return differences

  // Check for null/undefined values (one is null/undefined but not the other)
  if (a === null || a === undefined || b === null || b === undefined) {
    if (a !== b) {
      differences.push({
        path,
        type: 'null_mismatch',
        expected: a,
        actual: b,
      })
    }

    return differences
  }

  // Check for different types (both non-null/non-undefined at this point)
  if (typeof a !== typeof b) {
    differences.push({
      path,
      type: 'different_type',
      expected: typeof a,
      actual: typeof b,
    })

    return differences
  }

  // If neither is an object, they are different primitive values
  if (typeof a !== 'object' || typeof b !== 'object') {
    // For strings, only compare first 2000 characters (matches intelligent-search behavior)
    const valA =
      typeof a === 'string' && typeof b === 'string' ? a.substring(0, 2000) : a

    const valB =
      typeof a === 'string' && typeof b === 'string' ? b.substring(0, 2000) : b

    if (valA !== valB) {
      differences.push({
        path,
        type: 'different_value',
        expected: a,
        actual: b,
      })
    }

    return differences
  }

  // Check if maximum recursion depth has been reached (only for objects)
  if (currentDepth > (options.maxDepth ?? 50)) {
    // When max depth is reached, consider values equal (original behavior)
    return differences
  }

  // Handle arrays specially
  if (Array.isArray(a) && Array.isArray(b)) {
    // Check if this path matches any existence comparison pattern
    const existenceFields = options.existenceCompareFields ?? []
    const matchResult = path
      ? findMatchingExistencePattern(path, existenceFields)
      : null

    if (matchResult) {
      // Use existence-based (key-based) comparison for matched fields
      return compareArraysByExistence(
        a,
        b,
        path,
        matchResult.key,
        options,
        currentDepth
      )
    }

    // Default position-based comparison
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
          ...findDifferences(a[i], b[i], currentPath, options, currentDepth + 1)
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
          options,
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
 * @param options Comparison options (maxDepth, existenceCompareFields)
 * @returns DeepComparisonResult with isEqual boolean and differences array
 */
export function isDeepEqual(
  a: unknown,
  b: unknown,
  options: FindDifferencesOptions = {}
): DeepComparisonResult {
  const mergedOptions = { maxDepth: 20, ...options }
  const differences = findDifferences(a, b, '', mergedOptions, 0)

  return {
    isEqual: differences.length === 0,
    differences,
  }
}

/**
 * Convert an ignore path pattern to a RegExp.
 * Escapes all regex special chars first, then un-escapes our wildcard tokens:
 *   - `[*]` → matches any numeric array index (e.g. `[0]`, `[1]`)
 *   - `*`   → matches any characters except dots and brackets
 *   - `[name:X]` is matched literally (already escaped correctly)
 */
function ignorePatternToRegex(pathPattern: string): RegExp {
  // 1. Escape all regex special characters
  let regex = pathPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // 2. Un-escape and replace [*] → match only numeric array indices (matches intelligent-search)
  regex = regex.replace(/\\\[\\\*\\\]/g, '\\[\\d+\\]')

  // 3. Un-escape and replace remaining * → match any chars except dots/brackets
  regex = regex.replace(/\\\*/g, '[^.\\[\\]]*')

  return new RegExp(`^${regex}$`)
}

/**
 * Check if a difference should be ignored based on wildcard pattern matching.
 * @param diff The difference to check
 * @param pattern The ignore pattern (string or object with path and optional type)
 * @returns Whether the difference should be ignored
 */
export function shouldIgnoreDifference(
  diff: ObjectDifference,
  pattern: IgnoredDifference
): boolean {
  const pathPattern = typeof pattern === 'string' ? pattern : pattern.path
  const typePattern = typeof pattern === 'string' ? undefined : pattern.type

  const regex = ignorePatternToRegex(pathPattern)

  if (!regex.test(diff.path)) {
    return false
  }

  // If no type specified in pattern, ignore all types for this path
  if (typePattern === undefined) {
    return true
  }

  return diff.type === typePattern
}

/**
 * Filters out differences that should be ignored based on path patterns and type.
 * Supports wildcard patterns in paths (`[*]`, `*`, `[name:X]`).
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
    return !ignoredDifferences.some((pattern) =>
      shouldIgnoreDifference(difference, pattern)
    )
  })
}

/**
 * Configuration for ignoring expected differences.
 * Can be a string (path pattern only, ignores all types) or an object
 * with a path pattern and optional type filter.
 *
 * Path patterns support wildcards:
 *   - `[*]` matches any array index (numeric `[0]` or named `[name:foo]`)
 *   - `*` matches any characters except dots and brackets
 *   - `[name:X]` matches a literal named index
 *
 * When `type` is omitted, all difference types are ignored for the matched path.
 */
export type IgnoredDifference =
  | string
  | {
      path: string
      type?:
        | 'missing_key'
        | 'extra_key'
        | 'different_value'
        | 'different_type'
        | 'null_mismatch'
        | 'array_length_mismatch'
    }

/**
 * Options for the compareApiResults function
 */
export interface CompareApiResultsOptions {
  args?: unknown
  logPrefix?: string
  ignoredDifferences?: IgnoredDifference[]
  existenceCompareFields?: ExistenceComparePattern[]
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
  const {
    logPrefix = 'API Comparison',
    ignoredDifferences = [],
    existenceCompareFields,
  } = options

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
      const comparisonResult = isDeepEqual(result1, result2, {
        existenceCompareFields,
      })

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
