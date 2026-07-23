# linkText intsch Origin Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Product.linkText` (and 5 related product fields) correctly distinguish `intsch`-origin products from legacy `intelligent-search`-origin products, so `linkText` gets translated to the shopper's binding locale on multibinding stores using the new PDP/PLP endpoints (TIS-707).

**Architecture:** Widen `SearchProduct.origin` to a proper union type (`'intelligent-search' | 'intsch' | undefined`), then update `node/resolvers/search/product.ts` so the `linkText` resolver treats `'intsch'` like catalog (goes through the existing Rewriter-based binding translation, bypassing the `ctx.translated` flag via the already-existing `ignoreIndexedTranslation` parameter), while the other 5 origin-gated fields (`clusterHighlights`, `productClusters`, `properties`, `specificationGroups`, `itemMetadata`) treat `'intsch'` exactly like `'intelligent-search'`. No fetch-layer changes — `origin` is not stamped or overridden anywhere in this repo.

**Tech Stack:** TypeScript, Jest + ts-jest (`node/`), VTEX IO `node` builder.

## Global Constraints

- Do not modify `node/typings/` files other than adding the `ProductOrigin` type/updating `SearchProduct.origin` (per repo convention `node/typings/Catalog.ts` and `Search.ts` are hand-maintained domain types, not Toolbelt-generated — confirmed via `git log` showing manual edits).
- Do not modify `manifest.json` version — versioning happens via `vtex release`, not this plan.
- Do not modify `node/services/product.ts` or `node/services/productSearch.ts` — `origin` already arrives correctly from each client's raw response; this repo does not stamp it. Today `intsch` still sends `origin: 'intelligent-search'` for compatibility, and a separate paired PR (out of this repo) will change it to `'intsch'` — this plan's code is inert until that lands, and that's expected.
- Every resolver-behavior change must be covered by a Jest test in `node/resolvers/search/product.test.ts` before being considered done.
- Follow existing code style in `node/resolvers/search/product.ts`: no shared helper function for the widened origin checks — repeat `origin === 'intsch' || origin === 'intelligent-search'` explicitly at each of the 5 call sites.

---

## File Structure

- Modify: `node/typings/Catalog.ts` — add `type ProductOrigin` and use it for `SearchProduct.origin`.
- Modify: `node/resolvers/search/product.ts` — `linkText`, `clusterHighlights`, `productClusters`, `properties`, `specificationGroups`, `itemMetadata` resolvers.
- Modify: `node/resolvers/search/product.test.ts` — new test cases for all of the above.
- Modify: `CHANGELOG.md` — add an `Unreleased` entry.

No new files are created.

---

### Task 1: Add `ProductOrigin` union type

**Files:**
- Modify: `node/typings/Catalog.ts:86-87`

**Interfaces:**
- Produces: global ambient type `ProductOrigin` (`'intelligent-search' | 'intsch'`), used by `SearchProduct.origin?: ProductOrigin`. No import needed anywhere — this file declares global ambient types with no `export` statements, consistent with the rest of `Catalog.ts`.

- [ ] **Step 1: Change the type declaration**

In `node/typings/Catalog.ts`, find:

```ts
interface SpecificationGroup {
  name: string
  originalName: string
  specifications: { name: string; originalName: string; values: string[] }
}
interface SearchProduct {
  origin?: string
  productId: string
```

Replace with:

```ts
interface SpecificationGroup {
  name: string
  originalName: string
  specifications: { name: string; originalName: string; values: string[] }
}
type ProductOrigin = 'intelligent-search' | 'intsch'
interface SearchProduct {
  origin?: ProductOrigin
  productId: string
```

- [ ] **Step 2: Type-check**

Run: `cd node && yarn lint`
Expected: no TypeScript errors (this is a widening of `string` to a stricter union; all existing `origin === 'intelligent-search'` comparisons remain valid).

- [ ] **Step 3: Commit**

```bash
git add node/typings/Catalog.ts
git commit -m "types: add ProductOrigin union type for SearchProduct.origin"
```

---

### Task 2: Fix `linkText` resolver to translate `intsch`-origin products

**Files:**
- Modify: `node/resolvers/search/product.ts:311-342`
- Test: `node/resolvers/search/product.test.ts:216-243`

**Interfaces:**
- Consumes: `ProductOrigin` (Task 1), `shouldTranslateToBinding(ctx: Context, ignoreIndexedTranslation?: boolean)` from `node/utils/i18n.ts` (already exists, unchanged).
- Produces: no new exports — behavior change only, within `resolvers.Product.linkText`.

- [ ] **Step 1: Write the failing tests**

In `node/resolvers/search/product.test.ts`, replace the existing `describe('linkText resolver', ...)` block (lines 216-243):

```ts
  describe('linkText resolver', () => {
    it('linkText with binding with different locales', async () => {
      const product = getProduct()

      mockContext.vtex.binding.locale = 'fr-FR'
      mockContext.clients.rewriter.getRoute.mockImplementationOnce(
        (id: string, type: string, bindingId: string) =>
          Promise.resolve(`/${id}-${type}-${bindingId}-${getBindingLocale()}/p`)
      )
      const result = await resolvers.Product.linkText(
        product as any,
        {},
        mockContext as any
      )

      expect(result).toBe('16-product-abc-fr-FR')
    })
    it('linkText for same binding language', async () => {
      const product = getProduct()
      const result = await resolvers.Product.linkText(
        product as any,
        {},
        mockContext as any
      )

      expect(result).toBe(product.linkText)
    })

    it('linkText is returned unchanged for intelligent-search origin, even with different binding locale', async () => {
      const product = getProduct({ origin: 'intelligent-search' })

      mockContext.vtex.binding.locale = 'fr-FR'
      const result = await resolvers.Product.linkText(
        product as any,
        {},
        mockContext as any
      )

      expect(result).toBe(product.linkText)
      expect(mockContext.clients.rewriter.getRoute).not.toHaveBeenCalled()
    })

    it('linkText is translated via rewriter for intsch origin with different binding locale, ignoring ctx.translated', async () => {
      const product = getProduct({ origin: 'intsch' })

      mockContext.vtex.binding.locale = 'fr-FR'
      mockContext.translated = true
      mockContext.clients.rewriter.getRoute.mockImplementationOnce(
        (id: string, type: string, bindingId: string) =>
          Promise.resolve(`/${id}-${type}-${bindingId}-${getBindingLocale()}/p`)
      )
      const result = await resolvers.Product.linkText(
        product as any,
        {},
        mockContext as any
      )

      expect(result).toBe('16-product-abc-fr-FR')
      expect(mockContext.clients.rewriter.getRoute).toHaveBeenCalledWith(
        product.productId,
        'product',
        'abc'
      )
    })

    it('linkText is returned unchanged for intsch origin when binding locale matches tenant locale', async () => {
      const product = getProduct({ origin: 'intsch' })

      mockContext.translated = true
      const result = await resolvers.Product.linkText(
        product as any,
        {},
        mockContext as any
      )

      expect(result).toBe(product.linkText)
      expect(mockContext.clients.rewriter.getRoute).not.toHaveBeenCalled()
    })
  })
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `cd node && yarn test resolvers/search/product.test.ts -t "linkText"`
Expected: The `intelligent-search origin, even with different binding locale` test already PASSES on today's code (it locks in existing behavior — `origin === 'intelligent-search'` already short-circuits before any binding check, unchanged by this fix). The two new `intsch` tests FAIL: today, `origin === 'intelligent-search'` never matches `'intsch'`, so the code falls to `!shouldTranslateToBinding(ctx)` — with `ctx.translated = true` and no `ignoreIndexedTranslation` support, that evaluates to `!false = true`, causing an early `return linkText`. So the "different binding locale" `intsch` test gets the untranslated `linkText` (`'classic-shoes'`) instead of `'16-product-abc-fr-FR'`, and `rewriter.getRoute` is asserted as called but was not.

- [ ] **Step 3: Implement the fix**

In `node/resolvers/search/product.ts`, find:

```ts
    linkText: async (
      { productId, linkText, origin }: SearchProduct,
      _: unknown,
      ctx: Context
    ) => {
      const {
        clients: { rewriter },
        vtex: { binding },
      } = ctx

      if (origin === 'intelligent-search' || !shouldTranslateToBinding(ctx)) {
        return linkText
      }
```

Replace with:

```ts
    linkText: async (
      { productId, linkText, origin }: SearchProduct,
      _: unknown,
      ctx: Context
    ) => {
      const {
        clients: { rewriter },
        vtex: { binding },
      } = ctx

      if (origin === 'intelligent-search') {
        return linkText
      }

      const ignoreIndexedTranslation = origin === 'intsch'

      if (!shouldTranslateToBinding(ctx, ignoreIndexedTranslation)) {
        return linkText
      }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd node && yarn test resolvers/search/product.test.ts -t "linkText"`
Expected: PASS (all 4 tests in the `linkText resolver` block).

- [ ] **Step 5: Commit**

```bash
git add node/resolvers/search/product.ts node/resolvers/search/product.test.ts
git commit -m "fix: translate linkText for intsch-origin products on multibinding stores"
```

---

### Task 3: Widen `clusterHighlights` origin check

**Files:**
- Modify: `node/resolvers/search/product.ts:210-216`
- Test: `node/resolvers/search/product.test.ts` (in the top-level `describe` block, near the existing `clusterHighlights` tests around line 164-214)

- [ ] **Step 1: Write the failing test**

In `node/resolvers/search/product.test.ts`, add after the existing `it('clusterHighlights should not break if value is null', ...)` block (around line 214, before the `describe('linkText resolver', ...)` block):

```ts
  it('clusterHighlights is returned as-is for both intelligent-search and intsch origins', () => {
    const rawClusterHighlights = [{ id: '140', name: 'Casual Footwear' }]
    const isProduct = getProduct({
      origin: 'intelligent-search',
      clusterHighlights: rawClusterHighlights,
    })

    const intschProduct = getProduct({
      origin: 'intsch',
      clusterHighlights: rawClusterHighlights,
    })

    expect(resolvers.Product.clusterHighlights(isProduct as any)).toEqual(
      rawClusterHighlights
    )
    expect(resolvers.Product.clusterHighlights(intschProduct as any)).toEqual(
      rawClusterHighlights
    )
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd node && yarn test resolvers/search/product.test.ts -t "clusterHighlights is returned as-is"`
Expected: FAIL — the `intsch` assertion fails because `origin === 'intelligent-search'` doesn't match `'intsch'`, so today's code runs `objToNameValue('id', 'name', clusterHighlights)` on an already-array value instead of returning it as-is.

- [ ] **Step 3: Implement the fix**

In `node/resolvers/search/product.ts`, find:

```ts
    clusterHighlights: ({ origin, clusterHighlights }: SearchProduct) => {
      if (origin === 'intelligent-search') {
        return clusterHighlights
      }
```

Replace with:

```ts
    clusterHighlights: ({ origin, clusterHighlights }: SearchProduct) => {
      if (origin === 'intsch' || origin === 'intelligent-search') {
        return clusterHighlights
      }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd node && yarn test resolvers/search/product.test.ts -t "clusterHighlights is returned as-is"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add node/resolvers/search/product.ts node/resolvers/search/product.test.ts
git commit -m "fix: treat intsch origin like intelligent-search for clusterHighlights"
```

---

### Task 4: Widen `productClusters` origin check

**Files:**
- Modify: `node/resolvers/search/product.ts:232-238`
- Test: `node/resolvers/search/product.test.ts` (near existing `productClusters` tests around line 138-162)

- [ ] **Step 1: Write the failing test**

Add after the existing `it('productClusters should not break if value is null', ...)` block:

```ts
  it('productClusters is returned as-is for both intelligent-search and intsch origins', () => {
    const rawProductClusters = [{ id: '140', name: 'Casual Footwear' }]
    const isProduct = getProduct({
      origin: 'intelligent-search',
      productClusters: rawProductClusters,
    })

    const intschProduct = getProduct({
      origin: 'intsch',
      productClusters: rawProductClusters,
    })

    expect(resolvers.Product.productClusters(isProduct as any)).toEqual(
      rawProductClusters
    )
    expect(resolvers.Product.productClusters(intschProduct as any)).toEqual(
      rawProductClusters
    )
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd node && yarn test resolvers/search/product.test.ts -t "productClusters is returned as-is"`
Expected: FAIL for the same reason as Task 3.

- [ ] **Step 3: Implement the fix**

In `node/resolvers/search/product.ts`, find:

```ts
    productClusters: ({ origin, productClusters }: SearchProduct) => {
      if (origin === 'intelligent-search') {
        return productClusters
      }
```

Replace with:

```ts
    productClusters: ({ origin, productClusters }: SearchProduct) => {
      if (origin === 'intsch' || origin === 'intelligent-search') {
        return productClusters
      }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd node && yarn test resolvers/search/product.test.ts -t "productClusters is returned as-is"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add node/resolvers/search/product.ts node/resolvers/search/product.test.ts
git commit -m "fix: treat intsch origin like intelligent-search for productClusters"
```

---

### Task 5: Widen `properties` origin check

**Files:**
- Modify: `node/resolvers/search/product.ts:240-265` (origin check at line 243)
- Test: `node/resolvers/search/product.test.ts` (in `describe('properties resolver', ...)`, around line 320-369)

- [ ] **Step 1: Write the failing test**

Add inside the `describe('properties resolver', ...)` block, after the last existing `it(...)`:

```ts
    it('properties uses product.properties as-is for both intelligent-search and intsch origins', async () => {
      const rawProperties = [
        { name: 'Color', originalName: 'Color', values: ['Red'] },
      ]
      const isProduct = getProduct({
        origin: 'intelligent-search',
        properties: rawProperties,
      })

      const intschProduct = getProduct({
        origin: 'intsch',
        properties: rawProperties,
      })

      const isResult = await resolvers.Product.properties(
        isProduct as any,
        {},
        mockContext as any
      )

      const intschResult = await resolvers.Product.properties(
        intschProduct as any,
        {},
        mockContext as any
      )

      expect(isResult).toEqual(rawProperties)
      expect(intschResult).toEqual(rawProperties)
    })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd node && yarn test resolvers/search/product.test.ts -t "properties uses product.properties as-is"`
Expected: FAIL — for the `intsch` product, today's code builds `valuesUntranslated` from `allSpecifications` (empty/default from `getProduct()`) instead of using `product.properties` directly, so `intschResult` won't equal `rawProperties`.

- [ ] **Step 3: Implement the fix**

In `node/resolvers/search/product.ts`, find:

```ts
      if (product.origin === 'intelligent-search') {
        valuesUntranslated = product.properties ?? []
      } else {
```

Replace with:

```ts
      if (product.origin === 'intsch' || product.origin === 'intelligent-search') {
        valuesUntranslated = product.properties ?? []
      } else {
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd node && yarn test resolvers/search/product.test.ts -t "properties uses product.properties as-is"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add node/resolvers/search/product.ts node/resolvers/search/product.test.ts
git commit -m "fix: treat intsch origin like intelligent-search for properties"
```

---

### Task 6: Widen `specificationGroups` origin check

**Files:**
- Modify: `node/resolvers/search/product.ts:344-423` (origin check at line 349)
- Test: `node/resolvers/search/product.test.ts` (in `describe('specificationGroups resolver', ...)`, around line 245-318)

- [ ] **Step 1: Write the failing test**

Add inside the `describe('specificationGroups resolver', ...)` block, after the last existing `it(...)`:

```ts
    it('specificationGroups returns product.specificationGroups as-is for both intelligent-search and intsch origins', async () => {
      const rawSpecificationGroups = [
        {
          name: 'Group',
          originalName: 'Group',
          specifications: [
            { name: 'Color', originalName: 'Color', values: ['Red'] },
          ],
        },
      ]
      const isProduct = getProduct({
        origin: 'intelligent-search',
        specificationGroups: rawSpecificationGroups,
      })

      const intschProduct = getProduct({
        origin: 'intsch',
        specificationGroups: rawSpecificationGroups,
      })

      const isResult = await resolvers.Product.specificationGroups(
        isProduct as any,
        {},
        mockContext as any
      )

      const intschResult = await resolvers.Product.specificationGroups(
        intschProduct as any,
        {},
        mockContext as any
      )

      expect(isResult).toBe(rawSpecificationGroups)
      expect(intschResult).toBe(rawSpecificationGroups)
    })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd node && yarn test resolvers/search/product.test.ts -t "specificationGroups returns product.specificationGroups as-is"`
Expected: FAIL — for the `intsch` product, today's code builds `noTranslationSpecificationGroups` from `allSpecificationsGroups` instead of returning `product.specificationGroups` directly, so `intschResult` won't be (`toBe`, same reference as) `rawSpecificationGroups`.

- [ ] **Step 3: Implement the fix**

In `node/resolvers/search/product.ts`, find:

```ts
      if (product.origin === 'intelligent-search') {
        return product.specificationGroups
      }
```

Replace with:

```ts
      if (
        product.origin === 'intsch' ||
        product.origin === 'intelligent-search'
      ) {
        return product.specificationGroups
      }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd node && yarn test resolvers/search/product.test.ts -t "specificationGroups returns product.specificationGroups as-is"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add node/resolvers/search/product.ts node/resolvers/search/product.test.ts
git commit -m "fix: treat intsch origin like intelligent-search for specificationGroups"
```

---

### Task 7: Widen `itemMetadata` origin check

**Files:**
- Modify: `node/resolvers/search/product.ts:472-545` (origin check at line 481)
- Test: `node/resolvers/search/product.test.ts` (new `describe('itemMetadata resolver', ...)` block — none exists today)

- [ ] **Step 1: Write the failing test**

Add a new `describe` block at the end of the top-level `describe('tests related to product resolver', ...)` block, right before its closing `})` (after the `describe('properties resolver', ...)` block):

```ts
  describe('itemMetadata resolver', () => {
    it('itemMetadata is built from items.attachments identically for both intelligent-search and intsch origins', () => {
      const isProduct = getProduct({ origin: 'intelligent-search' })
      const intschProduct = getProduct({ origin: 'intsch' })

      const isResult = resolvers.Product.itemMetadata(isProduct as any)
      const intschResult = resolvers.Product.itemMetadata(intschProduct as any)

      expect(intschResult).toEqual(isResult)
      expect(isResult.items).toHaveLength(isProduct.items.length)
    })

    it('itemMetadata is returned as-is for catalog origin (undefined)', () => {
      const product = getProduct({ itemMetadata: { items: [] } })
      const result = resolvers.Product.itemMetadata(product as any)

      expect(result).toEqual({ items: [] })
    })
  })
```

- [ ] **Step 2: Run tests to verify the intsch one fails**

Run: `cd node && yarn test resolvers/search/product.test.ts -t "itemMetadata"`
Expected: FAIL for `itemMetadata is built from items.attachments identically ...` — today's code only builds from `items.attachments` when `origin === 'intelligent-search'`; for `origin === 'intsch'` it falls through to `return itemMetadata` (`undefined` on the default mock), so `intschResult` won't equal `isResult`. The catalog test should already PASS (no code change needed there), confirming it as a baseline regression check.

- [ ] **Step 3: Implement the fix**

In `node/resolvers/search/product.ts`, find:

```ts
      // Since the IS doesn't return the itemMetadata, we need to build it from the items.attachments
      if (origin === 'intelligent-search') {
```

Replace with:

```ts
      // Since the IS doesn't return the itemMetadata, we need to build it from the items.attachments
      if (origin === 'intsch' || origin === 'intelligent-search') {
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd node && yarn test resolvers/search/product.test.ts -t "itemMetadata"`
Expected: PASS (both tests).

- [ ] **Step 5: Commit**

```bash
git add node/resolvers/search/product.ts node/resolvers/search/product.test.ts
git commit -m "fix: treat intsch origin like intelligent-search for itemMetadata"
```

---

### Task 8: Update CHANGELOG and run full verification

**Files:**
- Modify: `CHANGELOG.md:8`

- [ ] **Step 1: Add the changelog entry**

In `CHANGELOG.md`, find:

```md
## [Unreleased]

## [1.104.0] - 2026-05-25
```

Replace with:

```md
## [Unreleased]

### Fixed

- `linkText` not translated to the shopper's binding locale on multibinding stores when using the new PDP/PLP endpoints (`intsch`). `origin === 'intsch'` is now treated distinctly from `origin === 'intelligent-search'` for `linkText` translation, and identically to it for `clusterHighlights`, `productClusters`, `properties`, `specificationGroups`, and `itemMetadata`. Requires a paired change on the `intsch` platform to send `origin: 'intsch'` — see [TIS-707](https://vtex-dev.atlassian.net/browse/TIS-707).

## [1.104.0] - 2026-05-25
```

- [ ] **Step 2: Run the full test suite**

Run: `cd node && yarn test`
Expected: PASS — all tests, including every test added in Tasks 2-7.

- [ ] **Step 3: Run the linter/type-check**

Run: `cd node && yarn lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: add changelog entry for intsch linkText fix"
```

---

## Self-Review Notes

- **Spec coverage:** Origin type (Task 1), `linkText` fix incl. same-locale non-regression (Task 2), all 5 widened checks (Tasks 3-7), testing plan (embedded in each task), cross-repo dependency documented in Global Constraints — matches every section of `specs/2026-07-10-linktext-intsch-origin-design.md`.
- **No placeholders:** every step has full, runnable code and exact `git`/`yarn` commands.
- **Type consistency:** `ProductOrigin` (Task 1) is referenced by name only in prose (Tasks 2-7 compare against the literal strings `'intsch'`/`'intelligent-search'` directly, matching the codebase's explicit-comparison style, not the type name itself) — no signature mismatches across tasks.
