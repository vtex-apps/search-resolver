# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
- Modify clients to avoid modifying the rest of the code with the objective of stop using SOLR search engine

Migrate from
https://developers.vtex.com/vtex-rest-api/reference/search-api-overview
To
https://developers.vtex.com/vtex-rest-api/reference/intelligent-search-api-overview

All the modifications are done on this file:
https://github.com/vtex-apps/search-resolver/blob/master/node/clients/search.ts



## [0.16.13] - 2022-02-14

### Fixed
- Use `fullText` when `query` is empty.

## [0.16.12] - 2022-01-04

### Fixed
- Dependabot PRs.

## [0.16.11] - 2021-12-21

### Fixed
- Dependabot PRs.

## [0.16.10] - 2021-08-16
### Changed
- Increase CPU request

## [0.16.9] - 2021-04-26

### Added
- `messages` policy to the `manifest.json`.

## [0.16.8] - 2021-03-24

### Changed
- Bump `search-graphql` version to `v0.43.0`.

## [0.16.7] - 2020-12-30
### Changed
- Increase maxReplicas to 150.
- Updates the version of search-graphql dependency.

## [0.16.6] - 2020-12-14
### Fixed
- Guarantee that `properties` will have `originalName`.

## [0.16.5] - 2020-12-10 [YANKED]
### Fixed
- Guarantee that `properties` will have `originalName`.

## [0.16.4] - 2020-12-10
### Fixed
- SearchMetadata for category, brand and collection.

## [0.16.3] - 2020-12-07
### Fixed
- Translates product cluster name

## [0.16.2] - 2020-12-01
### Fixed
- Return all specifications if there's no information on which specifications are visibile or not.

## [0.16.1] - 2020-11-10
### Fixed
- Return only visible product specifications.

## [0.16.0] - 2020-10-20
### Added
- Uses groupId as the context for product specification groups

## [0.15.0] - 2020-10-08
### Changed
- Use new feature of Search API to group SKUs in product recommendation shelves.

## [0.14.1] - 2020-10-05
### Fixed
- `lowValue` on `ProductPriceRange` cannot be `0` anymore.

## [0.14.0] - 2020-10-05
### Added
- `Facets` field resolver to add `quantity` and make it possible to limit facet values.

## [0.13.1] - 2020-09-16
### Fixed
- Beta version of `vtex.search-graphql` being used.

## [0.13.0] - 2020-09-16
### Added
- Support for `excludedPaymentSystems` and `includedPaymentSystems` arguments in `Installments` type.

## [0.12.1] - 2020-09-10
### Fixed
- Avoid breaking if `imageUrl` is null.

## [0.12.0] - 2020-09-08
### Added
- Support for `salesChannel` argument in `productsByIdentifier` query.

## [0.11.1] - 2020-08-12
### Fixed
- Translate metadata names with their IDs in context.

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
