const MAX_DEPTH = 10
const MAX_ARRAY_ELEMENTS = 10

export type DiffCategory = 'legacy_has_more' | 'new_has_more' | 'both_different'

export interface StructuralDifference {
  path: string
  type:
    | 'missing_key'
    | 'extra_key'
    | 'array_length_mismatch'
    | 'presence_mismatch'
    | 'type_mismatch'
  valueA?: unknown
  valueB?: unknown
}

export interface StructuralCompareResult {
  diffs: StructuralDifference[]
  summary: DiffCategory[]
}

function typeToCategory(type: StructuralDifference['type']): DiffCategory {
  if (type === 'extra_key') return 'new_has_more'

  if (type === 'missing_key') return 'legacy_has_more'

  return 'both_different'
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true

  if (typeof value === 'string' && value === '') return true

  if (Array.isArray(value) && value.length === 0) return true

  return false
}

function getKeys(value: unknown): string[] {
  if (value === null || value === undefined) return []

  if (typeof value !== 'object') return []

  return Object.keys(value as object)
}

interface CompareRecParams {
  a: unknown
  b: unknown
  path: string
  currentDepth: number
}

function compareRec(params: CompareRecParams): StructuralDifference[] {
  const { a, b, path, currentDepth } = params
  const diffs: StructuralDifference[] = []

  if (currentDepth > MAX_DEPTH) {
    return diffs
  }

  const typeA = Array.isArray(a) ? 'array' : typeof a
  const typeB = Array.isArray(b) ? 'array' : typeof b

  if (typeA !== typeB) {
    diffs.push({
      path: path || '(root)',
      type: 'type_mismatch',
      valueA: a,
      valueB: b,
    })

    return diffs
  }

  if (typeof a !== 'object' || a === null) {
    const emptyA = isEmpty(a)
    const emptyB = isEmpty(b)

    if (emptyA !== emptyB) {
      diffs.push({
        path: path || '(root)',
        type: 'presence_mismatch',
        valueA: a,
        valueB: b,
      })
    }

    return diffs
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      diffs.push({
        path: path || '(root)',
        type: 'array_length_mismatch',
        valueA: a.length,
        valueB: b.length,
      })

      return diffs
    }

    const arrPath = path || '(root)'
    const elementsToCompare = Math.min(a.length, MAX_ARRAY_ELEMENTS)

    for (let i = 0; i < elementsToCompare; i++) {
      const elPath = arrPath === '(root)' ? `[${i}]` : `${arrPath}[${i}]`

      diffs.push(
        ...compareRec({
          a: (a as unknown[])[i],
          b: (b as unknown[])[i],
          path: elPath,
          currentDepth: currentDepth + 1,
        })
      )
    }

    return diffs
  }

  const keysA = getKeys(a) as string[]
  const keysB = getKeys(b) as string[]
  const setB = new Set(keysB)

  for (const key of keysA) {
    const keyPath = path ? `${path}.${key}` : key

    if (!setB.has(key)) {
      diffs.push({
        path: keyPath,
        type: 'missing_key',
        valueA: (a as Record<string, unknown>)[key],
        valueB: undefined,
      })

      continue
    }

    const childA = (a as Record<string, unknown>)[key]
    const childB = (b as Record<string, unknown>)[key]

    diffs.push(
      ...compareRec({
        a: childA,
        b: childB,
        path: keyPath,
        currentDepth: currentDepth + 1,
      })
    )
  }

  for (const key of keysB) {
    if (!keysA.includes(key)) {
      diffs.push({
        path: path ? `${path}.${key}` : key,
        type: 'extra_key',
        valueA: undefined,
        valueB: (b as Record<string, unknown>)[key],
      })
    }
  }

  return diffs
}

export function structuralCompare(
  a: unknown,
  b: unknown
): StructuralCompareResult {
  const diffs = compareRec({ a, b, path: '', currentDepth: 0 })
  const categorySet = new Set<DiffCategory>()

  for (const d of diffs) {
    categorySet.add(typeToCategory(d.type))
  }

  const summary = Array.from(categorySet)

  return { diffs, summary }
}
