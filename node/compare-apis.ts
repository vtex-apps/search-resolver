/* eslint-disable */
/**
 * Standalone script to compare Biggy vs Intsch product search responses
 * using the real compareApiResults function from search-resolver.
 *
 * Run:
 *   cd node && npx ts-node compare-apis.ts
 *
 * Run specific queries by ID:
 *   cd node && npx ts-node compare-apis.ts 1 2
 *
 * List available queries:
 *   cd node && npx ts-node compare-apis.ts --list
 */

import https from 'https'

import {
  compareApiResults,
  findDifferences,
  filterIgnoredDifferences,
  type IgnoredDifference,
} from './utils/compareResults'
import {
  PRODUCT_SEARCH_EXISTENCE_COMPARE_FIELDS,
  PRODUCT_SEARCH_IGNORED_DIFFERENCES,
} from './services/productSearch'

// ============================================================================
// Helpers
// ============================================================================

function fetchJson(
  url: string,
  headers: Record<string, string> = {}
): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: { accept: 'application/json', ...headers },
    }

    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk: string) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode! >= 200 && res.statusCode! < 300) {
          try {
            resolve(JSON.parse(data))
          } catch (e: any) {
            reject(new Error(`JSON parse error: ${e.message}`))
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 500)}`))
        }
      })
    })

    req.on('error', reject)
    req.setTimeout(30000, () => {
      req.destroy()
      reject(new Error('Timeout'))
    })
    req.end()
  })
}

/**
 * Parse a production URL to extract account, API path, and query parameters.
 * Mirrors parseProductionUrl from intelligent-search/test-commons.js.
 */
function parseProductionUrl(url: string) {
  const urlObj = new URL(url)
  const account = urlObj.hostname.split('.')[0]
  const pathMatch = urlObj.pathname.match(
    /\/_v\/api\/intelligent-search\/(facets|product_search)(.*)$/
  )
  const apiPath = pathMatch ? pathMatch[2] : urlObj.pathname
  const apiType = pathMatch ? pathMatch[1] : 'unknown'

  return {
    account,
    apiType,
    path: apiPath,
    queryParams: urlObj.searchParams,
    fullPath: urlObj.pathname,
    search: urlObj.search,
  }
}

/**
 * Build intsch URL from parsed production URL.
 * Mirrors buildLocalUrl from intelligent-search/test-local-product-search-api.js
 * but targets the myvtex.com intsch endpoint instead of localhost.
 */
function buildIntschUrl(parsed: ReturnType<typeof parseProductionUrl>) {
  const intschParams = new URLSearchParams(parsed.queryParams)

  intschParams.set('an', parsed.account)

  return `https://${
    parsed.account
  }.myvtex.com/api/intelligent-search/v0/product-search${
    parsed.path
  }?${intschParams.toString()}`
}

// ============================================================================
// Mock logger — prints to console
// ============================================================================

const logger = {
  info: (obj: any) => {
    console.log(`  ✔ ${obj.message}`)
    if (obj.totalDifferences > 0) {
      console.log(
        `    (${obj.totalDifferences} total diffs, ${obj.ignoredDifferences} ignored)`
      )
    }
  },
  error: (obj: any) => {
    console.log(`  ✘ ${obj.message}`)
    console.log(
      `    ${obj.differenceCount} unignored / ${obj.totalDifferences} total / ${obj.ignoredDifferences} ignored`
    )
    if (obj.differences) {
      for (const d of obj.differences.slice(0, 10)) {
        console.log(`      ${d.path} [${d.type}]`)
        if (d.expected !== undefined)
          console.log(
            `        expected: ${JSON.stringify(d.expected).substring(0, 120)}`
          )
        if (d.actual !== undefined)
          console.log(
            `        actual:   ${JSON.stringify(d.actual).substring(0, 120)}`
          )
      }
      if (obj.differenceCount > 10) {
        console.log(`      ... and ${obj.differenceCount - 10} more`)
      }
    }
  },
  warn: () => {},
  debug: () => {},
} as any

// ============================================================================
// Test query definitions
// Matches the structure of intelligent-search/test-local-product-search-api.js
// ============================================================================

interface TestQuery {
  /** Unique numeric identifier for CLI selection */
  id: number
  /** Full production URL (biggy) */
  url: string
  /** Optional headers (e.g. x-vtex-segment) */
  headers?: Record<string, string>
  /** If true, query is skipped by default (can be overridden by passing the ID explicitly) */
  skip?: boolean
  /** Optional per-query ignored differences (merged with PRODUCT_SEARCH_IGNORED_DIFFERENCES) */
  ignoredDifferences?: IgnoredDifference[]
}

const QUERIES: TestQuery[] = [
  // ============================================================================
  // TYPE: Full text search with location (Brazil)
  // ============================================================================
  {
    id: 1,
    url: "https://vendemo.myvtex.com/_v/api/intelligent-search/product_search/?query=adidas+women's+microdot+polo&locale=pt-BR&from=0&to=9&hideUnavailableItems=true&simulationBehavior=default&zip-code=24230220&coordinates=-43.10804748535156%2C-22.910741806030273&country=BRA",
    headers: {
      'x-vtex-segment':
        'eyJjYW1wYWlnbnMiOm51bGwsImNoYW5uZWwiOiIxIiwicHJpY2VUYWJsZXMiOm51bGwsInJlZ2lvbklkIjpudWxsLCJ1dG1fY2FtcGFpZ24iOm51bGwsInV0bV9zb3VyY2UiOm51bGwsInV0bWlfY2FtcGFpZ24iOm51bGwsImN1cnJlbmN5Q29kZSI6IkJSTCIsImN1cnJlbmN5U3ltYm9sIjoiUiQiLCJjb3VudHJ5Q29kZSI6IkJSQSIsImN1bHR1cmVJbmZvIjoicHQtQlIiLCJhZG1pbl9jdWx0dXJlSW5mbyI6InB0LUJSIiwiY2hhbm5lbFByaXZhY3kiOiJwdWJsaWMiLCJmYWNldHMiOiJzaGlwcGluZz1kZWxpdmVyeTtwaWNrdXBQb2ludD0xXzA3NTAzMjhiLTA5NTMtNDg5Ni04YzlhLWIwYWEyNjY5YTdjNjt6aXAtY29kZT0yNDIzMDIyMDtjb3VudHJ5PUJSQTtjb29yZGluYXRlcz0tNDMuMTA4MDQ3NDg1MzUxNTYsLTIyLjkxMDc0MTgwNjAzMDI3MztkZWxpdmVyeVpvbmVzSGFzaD00MDEzY2I5ZjJhMjZjM2RjMGI0NmM0ZTgxZTZiNGMzZjtwaWNrdXBQb2ludHNIYXNoPTE2OTcyZjllOWRlMzczM2JmZWFmMmFhOWQwMzY3OTkxOyJ9',
    },
  },

  // ============================================================================
  // TYPE: Category navigation - PC gaming (Romania)
  // ============================================================================
  {
    id: 2,
    url: 'https://infinityro.myvtex.com/_v/api/intelligent-search/product_search/c/pc-gaming-si-accesorii/?map=c&hideUnavailableItems=true&removeHiddenFacets=false&behavior=Dynamic&categoryTreeBehavior=default&initialAttributes=c&locale=ro-RO',
    headers: {
      'x-vtex-segment':
        'eyJjYW1wYWlnbnMiOm51bGwsImNoYW5uZWwiOiIxIiwicHJpY2VUYWJsZXMiOm51bGwsInJlZ2lvbklkIjpudWxsLCJ1dG1fY2FtcGFpZ24iOm51bGwsInV0bV9zb3VyY2UiOm51bGwsInV0bWlfY2FtcGFpZ24iOm51bGwsImN1cnJlbmN5Q29kZSI6IlJPTiIsImN1cnJlbmN5U3ltYm9sIjoiUk9OIiwiY291bnRyeUNvZGUiOiJST1UiLCJjdWx0dXJlSW5mbyI6InJvLVJPIiwiY2hhbm5lbFByaXZhY3kiOiJwdWJsaWMifQ',
    },
  },
  {
    id: 3,
    url: 'https://biggy.myvtex.com/_v/api/intelligent-search/product_search/?query=camisa',
  },
]

// ============================================================================
// Main
// ============================================================================

async function runQuery(query: TestQuery) {
  const parsed = parseProductionUrl(query.url)
  const biggyUrl = query.url
  const intschUrl = buildIntschUrl(parsed)
  const headers = query.headers ?? {}

  console.log(`\n━━━ [${query.id}] ${parsed.account}: ${parsed.path} ━━━`)
  console.log(`  Biggy:  ${biggyUrl.substring(0, 120)}...`)
  console.log(`  Intsch: ${intschUrl.substring(0, 120)}...`)
  if (Object.keys(headers).length > 0) {
    console.log(`  Headers: ${Object.keys(headers).join(', ')}`)
  }

  // 1. Fetch both
  console.log('\n  Fetching...')

  let biggyData: any
  let intschData: any

  try {
    ;[biggyData, intschData] = await Promise.all([
      fetchJson(biggyUrl, headers),
      fetchJson(intschUrl, headers),
    ])
  } catch (err: any) {
    console.log(`  ERROR fetching: ${err.message}`)

    return
  }

  console.log(
    `  Biggy:  ${biggyData.recordsFiltered} records, ${
      biggyData.products?.length ?? 0
    } products`
  )
  console.log(
    `  Intsch: ${intschData.recordsFiltered} records, ${
      intschData.products?.length ?? 0
    } products`
  )

  // 2. Quick sanity checks
  const biggyIds = biggyData.products?.map((p: any) => p.productId) ?? []
  const intschIds = intschData.products?.map((p: any) => p.productId) ?? []
  const sameOrder = JSON.stringify(biggyIds) === JSON.stringify(intschIds)

  console.log(`  Same product order: ${sameOrder ? 'yes' : 'NO'}`)
  if (!sameOrder) {
    console.log(`    Biggy IDs:  ${biggyIds.join(', ')}`)
    console.log(`    Intsch IDs: ${intschIds.join(', ')}`)
  }

  // 3. Run the real compareApiResults
  console.log('\n  Running compareApiResults...')

  const ignored = [
    ...PRODUCT_SEARCH_IGNORED_DIFFERENCES,
    ...(query.ignoredDifferences ?? []),
  ]

  await compareApiResults(
    async () => biggyData,
    async () => intschData,
    100,
    logger,
    {
      logPrefix: `[${query.id}] ${parsed.account}`,
      ignoredDifferences: ignored,
      existenceCompareFields: PRODUCT_SEARCH_EXISTENCE_COMPARE_FIELDS,
      args: { url: query.url },
    }
  )

  // 4. Also run findDifferences + filterIgnoredDifferences directly
  const allDiffs = findDifferences(biggyData, intschData, '', {
    existenceCompareFields: PRODUCT_SEARCH_EXISTENCE_COMPARE_FIELDS,
  })
  const filtered = filterIgnoredDifferences(allDiffs, ignored)

  console.log(
    `\n  findDifferences: ${allDiffs.length} total, ${filtered.length} after filtering`
  )
}

/**
 * Get a short description of a query for listing.
 * Mirrors getQueryDescription from intelligent-search/test-local-product-search-api.js
 */
function getQueryDescription(query: TestQuery): string {
  try {
    const urlObj = new URL(query.url)
    const account = urlObj.hostname.split('.')[0]
    const pathParts = urlObj.pathname
      .replace('/_v/api/intelligent-search/product_search', '')
      .split('/')
      .filter(Boolean)

    const path =
      pathParts.length > 0
        ? '/' +
          pathParts.slice(0, 4).join('/') +
          (pathParts.length > 4 ? '/...' : '')
        : '/'

    return `${account}: ${path}`
  } catch {
    return query.url.substring(0, 60) + '...'
  }
}

function listQueries() {
  console.log('\nAvailable test queries:\n')
  console.log('-'.repeat(80))

  let skippedCount = 0

  for (const query of QUERIES) {
    const hasHeaders = query.headers && Object.keys(query.headers).length > 0

    const headerIndicator = hasHeaders ? ' [H]' : ''
    const skipIndicator = query.skip ? ' [SKIP]' : ''

    if (query.skip) skippedCount++
    console.log(
      `  [${String(query.id).padStart(2)}] ${getQueryDescription(
        query
      )}${headerIndicator}${skipIndicator}`
    )
  }

  console.log('-'.repeat(80))
  console.log('\n[H] = includes headers (x-vtex-segment)')
  console.log('[SKIP] = skipped by default (pass ID explicitly to run)')
  if (skippedCount > 0) {
    console.log(
      `\n${
        QUERIES.length - skippedCount
      } active, ${skippedCount} skipped by default`
    )
  }

  console.log('\nUsage:')
  console.log(
    '  npx ts-node compare-apis.ts           # Run all non-skipped tests'
  )
  console.log(
    '  npx ts-node compare-apis.ts 1 2       # Run only tests 1 and 2 (ignores skip)'
  )
  console.log('  npx ts-node compare-apis.ts --list    # Show this list\n')
}

async function main() {
  const args = process.argv.slice(2)

  // Check for --list flag
  if (args.includes('--list') || args.includes('-l')) {
    listQueries()
    process.exit(0)
  }

  // Check for --help flag
  if (args.includes('--help') || args.includes('-h')) {
    console.log('\nUsage: npx ts-node compare-apis.ts [options] [id1 id2 ...]')
    console.log('\nOptions:')
    console.log(
      '  --list, -l    List all available test queries with their IDs'
    )
    console.log('  --help, -h    Show this help message')
    console.log('\nExamples:')
    console.log(
      '  npx ts-node compare-apis.ts           # Run all non-skipped tests'
    )
    console.log(
      '  npx ts-node compare-apis.ts 1 2       # Run only tests 1 and 2 (ignores skip)'
    )
    console.log(
      '  npx ts-node compare-apis.ts --list    # Show all available tests\n'
    )
    process.exit(0)
  }

  // Parse requested IDs
  const requestedIds = args
    .filter((arg) => !arg.startsWith('-'))
    .map((arg) => parseInt(arg, 10))
    .filter((id) => !isNaN(id))

  let queries: TestQuery[]

  if (requestedIds.length > 0) {
    // When IDs are explicitly provided, ignore the skip attribute
    const idSet = new Set(requestedIds)

    queries = QUERIES.filter((q) => idSet.has(q.id))

    // Check for invalid IDs
    const validIds = new Set(QUERIES.map((q) => q.id))
    const invalidIds = requestedIds.filter((id) => !validIds.has(id))

    if (invalidIds.length > 0) {
      console.warn(`Warning: Invalid ID(s): ${invalidIds.join(', ')}`)
      console.warn(`   Valid IDs: ${QUERIES.map((q) => q.id).join(', ')}`)
    }

    if (queries.length === 0) {
      console.log('No valid queries found for the provided IDs.')
      console.log('   Use --list to see available test IDs.')
      process.exit(1)
    }

    const skippedButRequested = queries.filter((q) => q.skip)

    if (skippedButRequested.length > 0) {
      console.log(
        `Running ${queries.length} selected test(s): IDs ${requestedIds.join(
          ', '
        )}`
      )
      console.log(
        `   (including ${skippedButRequested.length} normally skipped)`
      )
    } else {
      console.log(
        `Running ${queries.length} selected test(s): IDs ${requestedIds.join(
          ', '
        )}`
      )
    }
  } else {
    // When running all tests, respect the skip attribute
    const active = QUERIES.filter((q) => !q.skip)
    const skipped = QUERIES.filter((q) => q.skip)

    queries = active
    if (skipped.length > 0) {
      console.log(
        `Skipping ${skipped.length} test(s) by default (IDs: ${skipped
          .map((q) => q.id)
          .join(', ')})`
      )
    }
  }

  console.log(`Running ${queries.length} query(s)...\n`)

  for (const query of queries) {
    await runQuery(query)
  }

  console.log('\n━━━ Done ━━━')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
