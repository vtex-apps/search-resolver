export type SemanticSearchParams = {
  semanticRatio?: number
}

/**
 * Blend ratio sent when hybrid search is enabled. `semanticModel` and the
 * rest of the backend's `isSemanticEnabled()` inputs (similarity, binning,
 * products, candidates, fusion function) must already be configured on the
 * account's storeSearchSettings — semanticModel is required there regardless
 * for indexing, so search-resolver sending it would do nothing. semanticRatio
 * is the one field NOT set on storeSearchSettings, so sending it is what
 * actually activates semantic ranking.
 */
const SEMANTIC_RATIO = 0.5

/**
 * Builds the semantic-search query param subset sent to the intsch client.
 * Returns `{}` when hybrid search is disabled; otherwise returns
 * `{ semanticRatio }`.
 */
export function buildSemanticSearchParams(
  enableHybridSearch: boolean
): SemanticSearchParams {
  return enableHybridSearch ? { semanticRatio: SEMANTIC_RATIO } : {}
}
