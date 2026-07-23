# Design: Distinguish `intsch` from `intelligent-search` origin for `linkText` translation

## Problem

[TIS-707](https://vtex-dev.atlassian.net/browse/TIS-707): on multibinding stores, `Product.linkText` is not translated to the binding's locale when the product data comes from the `intsch` client (the direct Intelligent Search platform client, gated by `shouldUseNewPDPEndpoint` / `shouldUseNewPLPEndpoint`).

Historically, `linkText` translation for Intelligent-Search-sourced products was handled server-side: the `vtex.intelligent-search-api` Node app called Rewriter itself before returning a response (see PR [#439](https://github.com/vtex-apps/search-resolver/pull/439)). Because of this, `node/resolvers/search/product.ts`'s `linkText` resolver treats `origin === 'intelligent-search'` as "already translated, return as-is":

```ts
linkText: async ({ productId, linkText, origin }: SearchProduct, _: unknown, ctx: Context) => {
  if (origin === 'intelligent-search' || !shouldTranslateToBinding(ctx)) {
    return linkText
  }
  // ... rewriter.getRoute() fallback
}
```

`intsch` bypasses `vtex.intelligent-search-api` and hits the Intelligent Search platform directly — it never performs that Rewriter call. Today, `intsch` responses still send `origin: 'intelligent-search'` (kept that way for compatibility with the other 5 checks below), so nothing in the response currently distinguishes it from the legacy path. This change is paired with a separate PR on the `intsch` platform side that will change its `origin` value to `'intsch'` — search-resolver does not stamp or override `origin` itself; see "Cross-repo dependency" below.

Additionally, `resolveProduct` (PDP fetch, `node/services/product.ts`) hardcodes `ctx.translated = true` whenever `shouldUseNewPDPEndpoint` is on, and the PLP fetch (`fetchProductSearchFromIntsch`, `node/services/productSearch.ts`) forwards the platform's own `raw.translated` flag. Either way, `ctx.translated` reflects the platform's query/content translation (correct for fields like `productName`/`description`, which the platform does translate via the `locale` param) — it says nothing about whether `linkText` specifically was translated, so it's the wrong signal to gate `linkText` on.

Separately, five other resolvers in `product.ts` branch on `origin === 'intelligent-search'` to pick between the modern (Intelligent Search) data shape and the legacy catalog shape: `clusterHighlights`, `productClusters`, `properties`, `specificationGroups`, `itemMetadata`. Since `intsch` shares the same modern data shape as `intelligent-search-api` for all five of these fields, they currently fall through to the legacy catalog branch when `origin === 'intsch'`, which is incorrect (though not the reported bug — these fields' current behavior is degraded, not user-visibly broken, since the fields still return *something* but computed for the wrong assumed shape).

## Goals

- Fix `linkText` translation for `intsch`-origin products on multibinding stores.
- Give `origin` a proper TypeScript union type instead of `string`.
- Fix the other 5 checks so they treat `intsch` the same as `intelligent-search`.
- Minimize risk: no changes to how products are fetched, no changes to `ctx.translated` semantics for other fields, no guessing at catalog response shapes.

## Non-goals

- Fixing `vtex.tenant.locale` incorrectly reporting the tenant's locale under a non-default binding (a separate, likely platform-level issue raised in the same Jira ticket — not something `search-resolver` can address).
- Refactoring the 5 non-`linkText` checks to duck-type by field presence instead of by origin value (considered and rejected — see Alternatives).
- Explicitly stamping an `origin: 'catalog'` value for the legacy `search` client path (left as `undefined`, matching current behavior).
- Changing what `origin` value `intsch` sends — that happens in a separate PR against the `intsch` platform, not in this repo.

## Cross-repo dependency

This change is inert until a paired PR on the `intsch` platform ships, changing its response to send `origin: 'intsch'` instead of `origin: 'intelligent-search'`. Until that lands:

- This repo's code changes are safe to merge and deploy independently — no behavior changes today, since `origin === 'intsch'` will simply never match (all `intsch` responses still report `'intelligent-search'`).
- Once the platform-side PR ships, `intsch`-origin products automatically start taking the new `linkText`-translation branch and the widened 5-field branches, with no further search-resolver deploy required.
- Tests in this repo mock `origin: 'intsch'` directly (see Testing below), so they validate the search-resolver side of the contract ahead of the platform change landing.

## Design

### 1. Origin type

In `node/typings/Catalog.ts`, replace the untyped `origin?: string` with a named union:

```ts
type ProductOrigin = 'intelligent-search' | 'intsch'

interface SearchProduct {
  origin?: ProductOrigin
  ...
}
```

`undefined` continues to mean the legacy catalog (Portal) path. No stamping is added anywhere in search-resolver — `node/services/product.ts` and `node/services/productSearch.ts` are not modified. The `'intsch'` value will start appearing in practice once the paired `intsch` platform PR ships (see "Cross-repo dependency" above); until then it only appears in this repo's tests.

### 2. `linkText` resolver

In `node/resolvers/search/product.ts`:

```ts
linkText: async ({ productId, linkText, origin }: SearchProduct, _: unknown, ctx: Context) => {
  const { clients: { rewriter }, vtex: { binding } } = ctx

  if (origin === 'intelligent-search') {
    return linkText
  }

  const ignoreIndexedTranslation = origin === 'intsch'

  if (!shouldTranslateToBinding(ctx, ignoreIndexedTranslation)) {
    return linkText
  }

  try {
    const route = await rewriter.getRoute(productId, 'product', binding!.id!)
    return urlToSlug(route) ?? linkText
  } catch (e) {
    logDegradedSearchError(ctx.vtex.logger, { ... })
  }

  return linkText
}
```

- `origin === 'intelligent-search'`: unchanged, trust `linkText` as-is (Rewriter translation already happened in `vtex.intelligent-search-api`).
- `origin === 'intsch'`: pass `ignoreIndexedTranslation: true` to `shouldTranslateToBinding` — the parameter already exists on that function (`node/utils/i18n.ts`) but is unused today. This makes the "already translated" flag (`ctx.translated`) irrelevant for this field specifically, while the binding-vs-tenant-locale mismatch check (`binding?.locale !== tenant?.locale`) still applies unconditionally, since `ignoreIndexedTranslation` only affects the `(!translated || ignoreIndexedTranslation)` clause of `shouldTranslateToBinding`. This means: if the binding's locale equals the tenant's locale, `shouldTranslateToBinding` still returns `false` and the rewriter is *not* called — same as it already behaves for catalog today.
- `origin === undefined` (catalog): unchanged.

No changes to `shouldTranslateToBinding` itself.

### 3. The other 5 origin checks

Each of the following sites in `node/resolvers/search/product.ts` changes from `origin === 'intelligent-search'` to `origin === 'intsch' || origin === 'intelligent-search'`, written out explicitly at each site (no shared helper):

| Field | Behavior when `intsch`/`intelligent-search` | Behavior when `undefined` (catalog) |
|---|---|---|
| `clusterHighlights` | return as-is | `objToNameValue('id', 'name', clusterHighlights)` |
| `productClusters` | return as-is | `objToNameValue('id', 'name', productClusters)` |
| `properties` | use `product.properties` | build from `allSpecifications` |
| `specificationGroups` | return `product.specificationGroups` | build from `allSpecificationsGroups` |
| `itemMetadata` | build from `items[].attachments` | return `itemMetadata` as-is |

Only the `intsch` branch's behavior changes (previously silently fell into the catalog branch); `intelligent-search` and catalog behavior are unchanged.

## Testing

Extend `node/resolvers/search/product.test.ts`:

- `linkText` resolver (extends existing `describe` block):
  - `origin: 'intelligent-search'`, binding locale ≠ tenant locale → returns `linkText` unchanged, `rewriter.getRoute` not called.
  - `origin: 'intsch'`, `ctx.translated: true`, binding locale ≠ tenant locale → `rewriter.getRoute` is called, translated slug returned.
  - `origin: 'intsch'`, `ctx.translated: true`, binding locale === tenant locale → `rewriter.getRoute` not called, `linkText` returned unchanged.
  - Existing `origin: undefined` (catalog) cases remain as regression coverage.
- `clusterHighlights`, `productClusters`, `properties`, `specificationGroups`, `itemMetadata`: add an `origin: 'intsch'` variant of each existing `origin: 'intelligent-search'` test, asserting identical output.

## Alternatives considered

- **Stamping `origin` at the fetch layer** (`services/product.ts` / `services/productSearch.ts`): rejected — the `origin` value change belongs upstream, in a paired PR against the `intsch` platform itself, not in search-resolver.
- **Duck-typing the 5 non-`linkText` checks by field presence** instead of widening the origin comparison: rejected for this change — would require verifying catalog's exact response shape for all 5 fields, which isn't fully verifiable from static code alone. Widening the origin comparison achieves the same fix with a smaller, easily-reviewed diff and no behavior change for the two origins whose behavior was already correct.
- **A shared `isSearchPlatformOrigin(origin)` helper** instead of repeating the `origin === 'intsch' || origin === 'intelligent-search'` condition at each site: rejected per explicit preference — the repeated condition is clearer to read at each call site than an indirection through a helper.
