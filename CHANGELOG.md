# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
