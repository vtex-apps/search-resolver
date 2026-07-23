<!-- managed-by: golden-path v1 -->
# Glossary

Domain vocabulary used in `vtex.search-resolver`.

| Term | Definition |
|---|---|
| **Resolver** | A GraphQL function that knows how to fetch data for a field in the schema. Lives under `node/resolvers/` here; the schema itself lives in `vtex.search-graphql`. |
| **Schema (of record)** | `vtex.search-graphql/graphql/schema.graphql`. Imported at runtime via the `vtex.search-graphql` dependency in `node/package.json` and loaded by `node/index.ts` as `schema from 'vtex.search-graphql/graphql'`. |
| **Schema Directive** | Custom directive registered in `node/directives/` (e.g. `@cacheControl`, `@withSegment`). Modifies field resolution at runtime. |
| **Trade Policy** / **Sales Channel** | Storefront segmentation key, sourced from `vtex.session` `store.channel.value`. Controls catalog tree, prices, inventory. |
| **Segment** | Per-shopper context (currency, country, region, UTMs). Decoded from `vtex_segment` cookie. |
| **Region (Regionalization)** | `regionId` representing shopper's logistic context. Drives the "new PDP/PLP endpoint" feature flags. |
| **Pickup Point** | Physical store/locker. Forwarded to `intelligent-search-api` for availability/sorting. |
| **Assembly Option** | Product configuration extension (gifts, customizations). Resolved by `node/resolvers/search/assemblyOption.ts`. |
| **Rewriter** | `vtex.rewriter` app — maps URL slugs to entities (product, brand, category). Used here to resolve canonical paths. |
| **Intelligent Search API (`intelligentSearchApi`, `intsch`)** | Two clients pointing to the IS backend. `intelligentSearchApi` (in `node/clients/intelligent-search-api.ts`) talks to `vtex.intelligent-search-api`; `intsch` (in `node/clients/intsch/`) talks directly to the IS platform service for lower-level endpoints. |
| **Search (`search` client)** | Legacy VTEX search backend. Coexists with Intelligent Search during the migration controlled by `shouldUseNewPDPEndpoint` and `shouldUseNewPLPEndpoint` settings. |
| **Feature Flag (app settings)** | Three boolean flags in `manifest.json:settingsSchema`: `slugifyLinks`, `shouldUseNewPDPEndpoint`, `shouldUseNewPLPEndpoint`. Read at runtime from app settings — not from FeatureHub. |
| **`@gocommerce/utils`** | Compatibility helpers for go-commerce store accounts. Imported in `node/utils/` and resolvers that branch by store type. |
| **`vtex.search-tests`** | External Cypress test repo run on PR via `vtex/action-io-app-cypress` against the `biggy` account. |
