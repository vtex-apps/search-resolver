# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Disable shadow traffic to prepare for Black Friday.

## [1.87.0] - 2025-10-27

### Added

- Feature flag to call the productSearch and facets using the intsch api.

### Changed 

- Make productSearch and facets send a % of the traffic to our routes on intsch.

### Fixed

- Make the productIdentifier call the intsch when the feature flag is on.

## [1.86.0] - 2025-10-21

### Changed

- Using shadow traffic to EKS to validate the v1 routes: banners, correction, suggestions.

## [1.85.1] - 2025-10-14

### Fixed

- Segment enconding while making PDP requests.

## [1.85.0] - 2025-10-13 [YANKED]

### Changed

- Using a feature flag to route the PDP traffic to some specific accounts.

## [1.84.0] - 2025-10-07

### Changed

- Switch banners endpoint to use intsch as primary with intelligentSearchApi as fallback.

## [1.83.0] - 2025-10-06

### Changed

- Start testing 10% of the fetchBanners traffic to intsch and compare the result against the VTEX /IO version.

## [1.82.0] - 2025-10-01

### Changed

- Switch correction endpoint to use intsch as primary with intelligentSearchApi as fallback.

## [1.81.0] - 2025-09-29

### Changed
- Switch autocomplete endpoints to use intsch as primary with intelligentSearchApi as fallback.
- Start testing 10% of the fetchCorrection traffic to intsch and compare the result against the VTEX /IO version.

## [1.80.0] - 2025-09-25

### Changed

- Change the differences log to contain the diff between the 2 results.

## [1.79.0] - 2025-09-24

### Changed

- Add new log line to the compareResults function so we can estimate the amount of requests that are different.

## [1.78.0] - 2025-09-24

### Changed

- Send 10% of the production traffic to the new intsch service authough still uses the result from the I/O app. For the routes: autocompleteSearchSuggestions, topSearches and searchSuggestions.

## [1.77.0] - 2025-09-23

### Changed

- Send 1% of the production traffic to the new intsch service authough still uses the result from the I/O app. 

## [1.76.0] - 2025-02-07

### Changed

- Pod scaling configs to use 0.8 vCPUs and 2Gb of memory.
- Increase minimum to 30.
- Reduce search-cache to 3000 items.

## [1.75.0] - 2025-02-04

### Changed

- Set minimum replicas to 5.
- Increased search cache size.
- Reduced apps cache size.

## [1.74.0] - 2025-01-29

### Changed

- Pod scaling configs to use 2 vCPUs and 4Gb of memory.

## [1.73.0] - 2025-01-22

### Changed

- Bump node builder to v7.

## [1.72.0] - 2024-08-20

### Added

- Pass `advertisementOptions` to Intelligent Search API on the `productSuggestions` query.

## [1.71.0] - 2024-07-09

### Added

- Pass `advertisementOptions` to Intelligent Search API on the `products` and `productSearch` queries.

## [1.70.0] - 2024-06-10

### Fix
- `videos` in productSearch query 

## [1.69.0] - 2024-03-21
- Parameter `groupBy` into `recommendations` and `productRecommendations` resolvers and `groupByProduct` in `crossSelling` search client.

## [1.68.0] - 2024-03-06

### Added
- `showSponsored` to `productSearch` params.

## [1.67.1] - 2023-10-18

## [1.67.0] - 2023-08-22

### Added
- `sponsoredProducts` query.

## [1.66.1] - 2023-08-18

### Fixed
- Retrieve translated text-based product specification values ("properties") when using the `productSearch` and `products` queries.

## [1.66.0] - 2023-08-01

### Fixed
- Version bump to reset circuit breaker

## [1.65.1] - 2023-04-24

### Fixed
- Error with `taxPercentage` when Price is `null`.

## [1.65.0] - 2023-04-18

## [1.64.2] - 2023-03-16

### Fixed
- Shipping options filter.

## [1.64.1] - 2023-02-27

### Added
- Path traversal validation.

## [1.64.0] - 2023-02-24

### Added
- Shipping option header to `productSearch` and `facets` queries.

## [1.63.1] - 2023-01-02

### Added
- `linkText` resolver.

## [1.63.0] - 2022-10-04

### Changed
- Returns degraded search result when a service fails.

### Added
- Logs for degraded search.

## [1.62.1] - 2022-07-11

### Changed
- Support lowercase sorting options.

## [1.62.0] - 2022-06-29

### Added
- `count` to `productSuggestions` query.

## [1.61.6] - 2022-06-13

### Fixed
- `discountHighlights` property.

## [1.61.5] - 2022-05-16

### Fixed
- Missing `settingsSchema` title.

## [1.61.4] - 2022-02-17

### Fixed
- `productSearch` query ignores the `allowRedirect` property.
- `productSuggestions` doesn't return any result when there is a redirect set.

## [1.61.3] - 2022-02-03

### Fixed 

- Product Search to return `searchState`. 

## [1.61.2] - 2022-01-28

### Fixed
-  Remove `selctedFacets` object from the facets querystring to avoid cache problems.

## [1.61.1] - 2022-01-27

### Fixed
-  Remove `selctedFacets` object from querystring to avoid cache problems.

## [1.61.0] - 2022-01-26

### Changed
- Migrate to the `intelligent-search-api`.

## [1.60.2] - 2022-01-18

### Changed
- Run e2e tests in parallel.

## [1.60.1] - 2022-01-05

### Fixed
- Duplicated error logs.

## [1.60.0] - 2022-01-04

### Added

- Log for search-api errors.

## [1.59.7] - 2021-12-28

### Fixed
- Remove unnecessary `translateToStoreDefaultLanguage` from the `facets` query.

## [1.59.6] - 2021-12-23

### Removed
- Unused param `fullText` from `SearchResultArgs`.

## [1.59.5] - 2021-12-21

### Fixed
- Dependabot PRs.

## [1.59.4] - 2021-12-09

### Feature
- Add segment to the `products` query.

## [1.59.3] - 2021-12-07

### Changed
- `rewriter` timeout.

## [1.59.2] - 2021-12-06

### Fixed
- Category ID in `categoriesTree`.

## [1.59.1] - 2021-11-24

### Changed
- Increase `maxReplicas` to 250.

## [1.59.0] - 2021-11-18

### Changed
- API route to use private seller filter as a header instead of a cookie.

## [1.58.8] - 2021-11-11

## [1.58.7] - 2021-11-11

### Fixed
- Use API `linkText` when binding and tenant locales are the same.

## [1.58.6] - 2021-11-09

### Changed
- Clean breadcrumb link for department, category, or brand.

## [1.58.5] - 2021-11-08

## [1.58.4] - 2021-11-08

### Fixed
- Translated `linkText`.

## [1.58.3] - 2021-10-18

### Fixed
- Add regionId to the cache key.

## [1.58.2] - 2021-10-18

### Fixed
- `itemsWithSimulation` that was not considering `salesChannel` argument.

## [1.58.1] - 2021-10-13

### Changed

- Bump `@vtex/vtexis-compatibility-layer"` version to `0.2.3`.

## [1.58.0] - 2021-10-13

### Added
- Filter by private seller.

## [1.57.0] - 2021-10-11

### Added
- Segmented facets.

## [1.56.0] - 2021-10-07

- Resolver requests now hit the AWS infrastructure instead of the azure one.

## [1.55.0] - 2021-10-05

## [1.54.3] - 2021-09-28

### Fixed
- Remove splunk log from simulation errors.

## [1.54.2] - 2021-09-27

## [1.54.1] - 2021-09-24

### Fixed
- Revert `v1.54.0`.

## [1.54.0] - 2021-09-22 [YANKED]

### Changed
- Use `vtexis-compatibility-layer` to convert the product and `itemsWithSimulation` to call the simulation API.

## [1.53.2] - 2021-09-17

### Fixed
- Revert `v1.53.1` and `v1.53.0`

## [1.53.1] - 2021-09-14 [YANKED]

### Fixed
- Fix `clusterHighlights` type.

## [1.53.0] - 2021-09-02 [YANKED]

### Changed
- Use `vtexis-compatibility-layer` to convert the product and `itemsWithSimulation` to call the simulation API.

## [1.52.3] - 2021-09-02

### Fixed
- Remove retries.

## [1.52.2] - 2021-08-24

### Fixed
- Error when `logisticsInfo` is empty.

## [1.52.1] - 2021-08-19 [YANKED]

### Changed 

- Simulation API to use the private route. 
- Seller availability to also use stock balance. 

## [1.52.0] - 2021-08-09
### Added
- Slugify link setting. Slugifies links using sindresorhus's slugify function instead of defaut catalog slug

## [1.51.2] - 2021-08-04

### Fixed
- Update default seller after the simulation call.

## [1.51.1] - 2021-07-29

### Fixed
- `productId` that was different from the catalog ID.

## [1.51.0] - 2021-07-29

### Feature
- Per-workspace search params

## [1.50.0] - 2021-07-27

### Added
- `sampling` to `facets` query response.

## [1.49.0] - 2021-07-15

### Added
- Category tree to the facets query.

## [1.48.0] - 2021-07-08

### Added
- `initialAttributes` to `facets` query.

## [1.47.4] - 2021-07-05

## [1.47.3] - 2021-07-05

### Fixed
- Searches with percentage.

## [1.47.2] - 2021-06-29
### Fixed
- Adds fallback image label

## [1.47.1] - 2021-06-28

### Added

- Consider utmi to simulation request.

## [1.47.0] - 2021-06-22

## [1.46.0] - 2021-06-17 [YANKED]

### Added
- `regionalizationv2` query string.

## [1.45.2] - 2021-06-16

### Fixed

- Unicode characters not being properly encoded when calling `pageType` API.
- `pageType` errors being silently dropped.

## [1.45.1] - 2021-06-15

### Fixed

- Use `itemId` instead of `productId` on benefit calls.

## [1.45.0] - 2021-06-14

### Added 

- `Options` object with `allowRedirect` flag to `ProductSearch` query.

## [1.44.1] - 2021-06-14

### Fixed

- Breadcrumb and filters with encoded values.

## [1.44.0] - 2021-06-08

### Added

- Splunk log for empty searches.

## [1.43.6] - 2021-06-07

## [1.43.5] - 2021-06-02
### Fixed
- Removes `region-id` before sending to search.

## [1.43.4] - 2021-06-02

## [1.43.3] - 2021-05-31
### Fixed
- Uses `query` param from `selectedFacets` in `searchMetadata` query if no `query` was passed

## [1.43.2] - 2021-05-31

## [1.43.1] - 2021-05-26

### Fixed

- `allSpecifications` does not have `productSpecifications`.

### Fixed

- Use `textAttributes` to build the `allSpecifications` object.

## [1.43.0] - 2021-05-26

### Changed
- Removed fallback ids from product reference id

## [1.42.1] - 2021-05-20

### Changed

- Yanked `v1.42.0` changes.

## [1.42.0] - 2021-05-19 [YANKED]

### Added

- Enable API cache to `facets`, `productSearch` and `topSearches`.

## [1.41.0] - 2021-05-19

### Added

- Cache to `productSearch` and `facets` queries on navigation pages.

## [1.40.0] - 2021-05-18

### Changed
- Use the locale returned by the search queries.

## [1.39.2] - 2021-05-17

### Fixed
- Missing specification values when it is a multi-language account.

## [1.39.1] - 2021-05-13

### Added
- utm info to the simulation call.

## [1.39.0] - 2021-05-05
### Changed
- Revert caching changes made on `1.37.9`.
- Force `top-searches` maxAge to `3600`.

## [1.38.4] - 2021-04-28
### Added
- `items.complementName` to compatibility layer.

## [1.38.3] - 2021-04-28

### Added
- `teasers` and `discountHighlights` from the simulation call.

## [1.38.2] - 2021-04-27

### Fixed
- Add `encodeURI` to facet key into `compatibility-layer`

## [1.38.1] - 2021-04-26

### Added
- `messages` policy to the `manifest.json`.

## [1.38.0] - 2021-04-20

### Added
- Splunk log for invalid map or query.

## [1.37.9] - 2021-04-05
### Changed
- Removed biggy search cache

## [1.37.8] - 2021-03-30
### Fixed
- Regionalization not working on shelves (`products` query).

## [1.37.7] - 2021-03-26
### Changed
- Yanked `v1.37.6` changes.

## [1.37.6] - 2021-03-26 [YANKED]
### Fixed
- Regionalization not working on shelves.

## [1.37.5] - 2021-03-26
### Changed
- Facet Value ordering, keeping selected values at the top.

## [1.37.4] - 2021-03-25
### Changed
- Reduced the number of workers to 2 

## [1.37.3] - 2021-03-24
### Fixed
- Issue on setting `salesChannel` to the `product` request.

## [1.37.2] - 2021-03-23


### Fixed

- Undefined `regionId` on simulation in the `ProductSearch` query.

### Added

- `RegionId` and `SalesChannel` to `product` query.

## [1.37.1] - 2021-03-17

### Changed
- GraphQL Schema.

## [1.37.0] - 2021-03-17

### Added
- Handle for `regionId` as query parameter. 

## [1.36.1] - 2021-03-17

### Fixed
- Only send number attributes that are sku attributes. 

## [1.36.0] - 2021-03-08

### Added
- `numberAttributes` to the `skuSpecifications`.

## [1.35.1] - 2021-02-26

### Fixed
- Breadcrumb `href`.

## [1.35.0] - 2021-02-11

### Added

- `removeHiddenFacets` to `facets` query.

## [1.34.6] - 2021-02-10
### Fixed
- Replaces `brand`, `category-*` to `b`, `c` respectively so portal does not explode when using the new search terms

## [1.34.5] - 2021-02-10

### Fixed
- `extraData` being overrided by `textAttributes`

## [1.34.4] - 2021-02-08

### Fixed
- `priceRange` not working for non-standard translations.

## [1.34.3] - 2021-02-08

### Fixed
- Breadcrumb and title translations.

## [1.34.2] - 2021-02-08

### Fixed
- `commertialOffer` price.

## [1.34.1] - 2021-02-05

### Added
- Field `teasers` to Seller.

## [1.34.0] - 2021-02-03

### Added
- Fields `name`, `nameComplete`, `ean` and `Videos` to SKU.
### Fixed
- Different SKU with the same image.

## [1.33.0] - 2021-02-01

### Added
- `hideUnavailableItems` to the `productSuggestions` query.

## [1.32.2] - 2021-01-28

### Changed
- Decode `searchState`.

## [1.32.1] - 2021-01-26

### Fixed
- `specificationGroups` when the group and the specification names are the same.

## [1.32.0] - 2021-01-21
### Fixed
- Sorts to specified product order when querying `"fullText":"product:78;90;356"`

## [1.31.1] - 2021-01-18

### Fixed
- Error when `textAttributes` is `undefined`.

## [1.31.0] - 2021-01-18

### Added
- `skuSpecifications` prop to the product.

## [1.30.2] - 2021-01-14

### Fixed
- Duplicated trade policy on headless stores.

## [1.30.1] - 2021-01-14

### Fixed
- Deal with undefined `attributes` array when setting the filter visibility.

## [1.30.0] - 2021-01-14

### Changed
- Filter visibility based on catalog.

## [1.29.5] - 2021-01-11

### Fixed
- `productSuggestions` trade policy.

## [1.29.4] - 2021-01-04

### Fixed
- Price range for stores in Italian and French.

## [1.29.3] - 2020-12-22
### Fixed
- Guarantee that `properties` will have `originalName`.

## [1.29.2] - 2020-12-22

### Fixed

- Error when `installments` is an empty array.

## [1.29.1] - 2020-12-22

### Changed

- Query string `language` to `locale`.

## [1.29.0] - 2020-12-15

### Added
- `language` for queries.

### Changed
- Increase maxReplicas to 150.

## [1.28.5] - 2020-12-10

### Fixed
- SearchMetadata for category, brand and collection.

## [1.28.4] - 2020-12-07

### Fixed

- Translates product cluster name

## [1.28.3] - 2020-12-03

### Fixed

- Default value of `selectedFacets` at trade policy method

## [1.28.2] - 2020-12-03

### Changed

- Use trade policy from selected facets in `productSearch` query. 

## [1.28.1] - 2020-12-03

### Added

- Log an object with the current search call when the app is linked.

## [1.28.0] - 2020-12-01

### Changed

- Replace `key` with `originalKey` in the `facets` query.

## [1.27.2] - 2020-12-01
### Fixed
- Return all specifications if there's no information on which specifications are visibile or not.

## [1.27.1] - 2020-11-16

### Fixed

- `Price` when `simulationBehavior` is `default`.

## [1.27.0] - 2020-11-16

### Added
- `operator` and `misspelled` to the `productSuggestions` query

## [1.26.0] - 2020-11-13

### Added

- X-VTEX-IS-ID header to calls to search.biggylabs

## [1.25.0] - 2020-11-12

### Added

- `hideUnavailableItems` field to the `products` query.

## [1.24.0] - 2020-11-11

### Added

- `hide-unavailable-items` query string.

## [1.23.3] - 2020-11-09

### Fixed

- Fill `PriceWithoutDiscount` when `simulationBehavior` is `default`.

## [1.23.2] - 2020-11-05

### Added

- `clusterHighlights` prop to the product

## [1.23.1] - 2020-11-05

### Changed

- Always return `range` for numeric facets.
- Show `maxValue` and `minValue` instead of `*` for bucket numeric facets.

## [1.23.0] - 2020-10-29

### Changed

- Added `stock` field to BiggySearchProduct, now using the seller.stock || sku.stock || product.stock and the return from simulation to check seller availability.

## [1.22.3] - 2020-10-26

### Fixed 

- Revert `Products` query with biggy search

## [1.22.2] - 2020-10-26

## Fixed

- Add `activeprivatesellers` to hiddenActiveValues

## [1.22.1] - 2020-10-21

### Fixed
- Return only visible product specifications.

## [1.22.0] - 2020-10-21

### Changed

- Products query to use biggy's search

## [1.21.5] - 2020-10-16
### Fixed
- Filter trade-policy and private-seller from appearing on breadcrumb

## [1.21.4] - 2020-10-15

### Changed
- Removed early return from building breadcrumb if textAttribute was not visible

## [1.21.3] - 2020-10-13
### Fixed
- Now getting last category from tree instead of first for product categoryId

## [1.21.2] - 2020-10-09
### Added
- `value.id` to category facets.
- `href` to all facet values.

## [1.21.1] - 2020-10-09
### Changed
- Adds a toLowerCase in Category's href

## [1.21.0] - 2020-10-09
### Added
- Return product clusters

## [1.20.2] - 2020-10-09
### Added
- Support for other languages in the `PRICERANGE`.

## [1.20.1] - 2020-10-08
### Added
- Now productClusterIds generate breadcrumb through productClusterNames

## [1.20.0] - 2020-10-08
### Changed
- Use new feature of Search API to group SKUs in product recommendation shelves.

## [1.19.0] - 2020-10-06
### Added
- `Facets` field resolver to add `quantity` and make it possible to limit facet values.

## [1.18.0] - 2020-10-06
### Added
- Filter by seller white label.

## [1.17.4] - 2020-10-05
### Fixed
- `lowValue` on `ProductPriceRange` cannot be `0` anymore.

## [1.17.3] - 2020-09-30

### Fixed
- Added selling price as option for price when filling product with simulation info.

## [1.17.2] - 2020-09-30

### Fixed
- When a simulation call failed on compatibility-layer we returned an empty page.

## [1.17.1] - 2020-09-30

### Fixed
- Return values to specifications.

## [1.17.0] - 2020-09-16
### Added
- Support for `excludedPaymentSystems` and `includedPaymentSystems` arguments in `Installments` type.

## [1.16.0] - 2020-09-14
### Added
- Support for `salesChannel` argument in `productsByIdentifier` query.

## [1.15.7] - 2020-09-08
### Fixed
- Add prefix to the cacheId.

## [1.15.6] - 2020-09-03

### Fixed
- Double encoded `fulltext`.

## [1.15.5] - 2020-08-28

### Fixed
- Fix null `installmentOption`.

## [1.15.4] - 2020-08-28

### Fixed
- Simulation fills the installment field.

## [1.15.3] - 2020-08-18

### Fixed
- Autocomplete queries.

## [1.15.2] - 2020-08-17

### Fixed

- Add calls to simulation for product sellers on compatibility layer.

## [1.15.1] - 2020-08-14

### Fixed
- Add `regionId` to the `simulationPayload`.

## [1.15.0] - 2020-08-13

### Added
- Categories and categoriesIds to compatibility layer from all trees.

## [1.14.1] - 2020-08-06

### Fixed
- Remove diacritics from API call.

## [1.14.0] - 2020-08-06

### Added
- Passing simulationBehavior to compatibilityLayer so it calls simulation for the default behavior.

## [1.13.3] - 2020-08-06

### Fixed

- Compatibility `variations` and `speficiations` not being set in some situations.

## [1.13.2] - 2020-08-06

### Added

- Relevant commits from the `0.x` branch.

### Fixed

- SKU variations being `undefined`.

## [1.13.1] - 2020-08-05

### Fixed

- Revert changes of v1.13.0.

## [1.13.0] - 2020-08-05 [YANKED]

### Added

- Relevant commits from the `0.x` branch.

## [1.12.1] - 2020-07-31

### Fixed

- Missing installment breaking compatibility.

## [1.12.0] - 2020-07-31

### Changed
- Bump `search-graphql` version to `v0.31.0`.

## [1.11.1] - 2020-07-31

## [1.11.0] - 2020-07-31

### Added
- Allow custom order options.

## [1.10.1] - 2020-07-31

### Fixed

- `attributePath` with spaces that dit not return results.

## [1.10.0] - 2020-07-21
### Added
- `originalName` to `SpecificationGroup`.
- `originalName` to `SpecificationGroupProperty`.
- `originalName` to `SKUSpecificationField`.
- `originalName` to `SKUSpecificationValue`.

## [1.9.1] - 2020-07-16

### Fixed
- Not treating a possible undefined object coming from product.specificationGroups

## [1.9.0] - 2020-07-15

### Added
- `variations`, `unitMultiplier` and `measurementUnit` (SKU), `allSpecifications`, `brandId` (product) and `tax` (seller) fields to output product in compatibility layer.

## [1.8.1] - 2020-07-10

### Fixed
- Deal with `null` exception in `product.split`.

## [1.8.0] - 2020-07-09
### Added
- `selectedProperties` to the product object.

## [1.7.0] - 2020-07-09

### Added
- Use catalog API to sort facet values.

## [1.6.5] - 2020-07-09

### Fixed
- Sort breadcrumb values based on `selectedFacets`.

## [1.6.4] - 2020-07-08

### Fixed
- Add missing `unescape` import in `compatibility-layer`.

## [1.6.3] - 2020-06-25

### Fixed
- Error when `allSpecifications` is undefined.

## [1.6.2] - 2020-06-25

### Added
- Multiple values to `PRICERANGE`.

## [1.6.1] - 2020-06-25

### Added
- `extraData` when `productOriginVtex` is `true`.

## [1.6.0] - 2020-06-18

### Added
- `location` attributes.
- `searchState` parsing.

## [1.5.1] - 2020-06-17

### Removed
- Deprecated breadcrumb.

## [1.5.0] - 2020-06-17

### Added
- Redirect query.
- Breadcrumb to `facets`.

### Changed
- Remove `suggestions`, `correction` and `banners` from `productSearchV3` and create a query for each one.

## [1.4.1] - 2020-06-17

### Fixed

- `taxPercentage` calculation.

## [1.4.0] - 2020-06-15

### Added
- Extra data to the specification array.

## [1.3.4] - 2020-06-09

### Added
- `vtex.sae-analytics@2.x` as dependency.

## [1.3.3] - 2020-06-05

### Added
- `cacheId` to the `convertBiggyProduct`.

## [1.3.2] - 2020-06-04

### Changed
- Remove `-`from breadcrumb.

## [1.3.1] - 2020-06-03

### Changed
- Remove cacheId.

## [1.3.0] - 2020-06-02

### Added
- `hidden` property to the facets query.

### Changed
- `productClusterIds` don't show up in breadcrumb anymore.

## [1.2.0] - 2020-05-29

### Changed

- Allows specification filters with type `number` to be used as buckets.

### Fixed

- Error when receiving selected facets with `undefined` value.

## [1.1.7] - 2020-05-28

### Changed
- Replace spaces by hyphens in the `buildAttributePath` function.

## [1.1.6] - 2020-05-28

### Fixed
- Order by Release Date.

## [1.1.5] - 2020-05-14
### Changed
- Update `biggySearch` client timeout.

### Fixed
- Fix `undefined` installments causing products to not show up. 

## [1.1.4] - 2020-05-13

### Fixed
- Fix pricerange selection by removing it from the `compatibilityArgs`.

## [1.1.3] - 2020-05-08
### Added
- `taxPercentage` stub resolver on `Offer`.

## [1.1.2] - 2020-05-07

### Fixed
- NaN price in slider.

## [1.1.1] - 2020-05-05

### Fixed
- Remove filter by available SKU from `convertBiggyProduct`.

## [1.1.0] - 2020-05-20
### Fixed
- General adjustments
- Reset repo based on `vtex.search-graphql`

## [1.0.0] - 2020-05-09
### Changed
- Use Elastic instead of SOLR.

## [0.11.0] - 2020-07-31

### Changed
- Bump `search-graphql` version to `v0.31.0`.

## [0.10.0] - 2020-07-21

### Added
- `originalName` to `SpecificationGroup`.
- `originalName` to `SpecificationGroupProperty`.
- `originalName` to `SKUSpecificationField`.
- `originalName` to `SKUSpecificationValue`.

## [0.9.0] - 2020-07-09

### Changed
- Update `vtex.search-graphql` version.

## [0.8.4] - 2020-07-09
### Fixed
- Translate variations fields inside the SKU items with id as well.

## [0.8.3] - 2020-07-08
### Fixed
- Decode specification names coming from catalog to remove special catalog characters.

## [0.8.2] - 2020-07-07
### Added
- Translation to `SKUSpecificationField` and `SKUSpecificationValue`.

## [0.8.1] - 2020-07-07

### Fixed
- Slugify facet keys before check if it is selected.

## [0.8.0] - 2020-06-17
### Added
- Add `suggestions`, `correction`, `banners`, and `redirect`.

## [0.7.3] - 2020-06-10
### Added
- Translation of specifications in product.

## [0.7.2] - 2020-06-08
### Fixed
- Categories and subcategories not being translated.

## [0.7.1] - 2020-06-03
### Fixed
- Error when message had null context for a bad search on catalog.

## [0.7.0] - 2020-06-03
### Changed
- Many changes to support multiple bindings stores with different locales.

## [0.6.3] - 2020-06-02

### Added
- Bump graphql version.

## [0.6.2] - 2020-05-13
### Changed
- Add error log if search item has non iterable sellers.

## [0.6.1] - 2020-05-12
### Changed
- Call the new catalog-api-proxy endpoint for authenticaded searches (B2B).

## [0.6.0] - 2020-05-07

## [0.5.0] - 2020-05-07
### Added
- `taxPercentage` resolver on `Offer`.

## [0.4.0] - 2020-05-05
### Changed
- Remove new urls logic

## [0.3.7] - 2020-05-05
### Fixed
- Adds context to brand translatable fields
- Adds context translation to category translatable fields

## [0.3.6] - 2020-05-05
### Fixed
- Adds context translation to sku translatable fields

## [0.3.5] - 2020-05-04
### Fixed
- Fixes `rawMessage.match is not a function`

## [0.3.4] - 2020-05-04
### Fixed
- Fixes the error: Cannot read property 'toString' of null

## [0.3.3] - 2020-05-04
### Fixed
- Uses locale from tenant instead of binding in strings translations

## [0.3.2] - 2020-04-29
### Changed
- Stop writing search stats to VBase.

## [0.3.1] - 2020-04-22
### Fixed
- `titleTag` returning `null` when the `productName` was `null`.

## [0.3.0] - 2020-04-20
### Added
- migrate search-graphql code to search-resolver

## [0.2.1] - 2020-04-16

## [0.2.0] - 2020-04-16 [YANKED]
### Added
- `spotPrice` resolver on `offer.ts`.

## [0.1.4] - 2020-04-15
### Fixed
- Remove unnecessary graphql-server dependency.

## [0.1.3] - 2020-04-03
### Changed
- Bump version to be built by `builder-hub@0.238.5` or higher.

## [0.1.2] - 2020-04-03
### Fixed
- Add portal segment policy.

## [0.1.0] - 2020-03-30
