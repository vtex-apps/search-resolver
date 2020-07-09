# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- variations, unitMultiplier and measurementUnit (SKU), allSpecifications, brandId (product) and tax (seller) fields to output product in compatibility layer.

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
