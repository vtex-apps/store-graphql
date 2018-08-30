# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- List of SKU Item IDs in the Benefit Resolver to indicate what SKU Items are taking part in the benefit.

## [2.25.0] - 2018-08-29
### Added
- `profilePicture` query

### Changed
- Arguments and return type of `uploadProfilePicture` mutation and its `update` sibling

## [2.24.0] - 2018-08-29
### Added
- `setPassword` mutation.

## [2.23.3] - 2018-08-28
### Removed
- Unused additional query to facets api inside the search resolver.

## [2.23.2] - 2018-08-24
### Fixed
- *Hotfix* Fix impersonable property name.

## [2.23.1] - 2018-08-24
### Changed
- Add `ImpersonatedUser` type in Session object.

## [2.23.0] - 2018-08-24
### Added
- New `payments` field to profile.

## [2.22.2] - 2018-08-23
### Changed
- Add optional fields `Id` and `Slug` to the `Facets` type.

## [2.22.1] - 2018-08-23

### Fixed
- Add similars data in `Recommendations` resolver.

## [2.22.0] - 2018-08-23
### Added
- New `Logistics` type and resolvers.

## [2.21.3] - 2018-08-23
### Changed
- Minor refact in session resolvers and add docs.

## [2.21.2] - 2018-08-23
### Fixed
- Syntax error in `Catalog` resolver.

## [2.21.1] - 2018-08-23
### Fixed
- Benefits resolver is now using only public endpoints.

## [2.21.0] - 2018-08-23
### Added
- Add `initializeSession`, `impersonate`, `depersonify` mutations to telemarketing app.

## [2.20.2] - 2018-08-22
### Fixed
- Throw specific error when the product is not found on product resolver in catalog.

## [2.20.1] - 2018-08-22
### Changed
- Return filtered facets based on the query and rest on the search resolver.

## [2.20.0] - 2018-08-15
### Added
- Add `ClientProfile` in `OrderForm` type.

### Changed
- Add `enableCookies: true` on checkout mutations.

## [2.19.1] - 2018-08-13
### Fixed
- Return profile on address delete

## [2.19.0] - 2018-08-13
### Added
- UploadAttachment resolver
- UpdateProfilePicture to allow replacing existing profile picture

### Changed
- UploadProfilePicture uses upload attachment resolver

## [2.18.1] - 2018-08-09
### Fixed
- Fix replace `http` to `https` to match only `http://`.

## [2.18.0] - 2018-08-08
### Changed
- Replace `http` to `https` in item `imageUrl` property.

## [2.17.0] - 2018-08-08
### Added
- Search in Gocommerce catalog when account is Gocommerce

## [2.16.0] - 2018-08-06
### Added
- Add title and meta tags in `category`, `search`, `brand` and `product` queries.

## [2.15.5] - 2018-08-03
### Fixed
- Removes undefined error in `Kititems` when products is undefined

## [2.15.4] - 2018-08-02
### Fixed
- `ProfileUpdate` mutation works when customFields only are provided

## [2.15.3] - 2018-07-30
### Fixed
- `Profile Resolver` error when profile data returned null.

## [2.15.2] - 2018-07-30

### Added
- `geoCoordinate` field to `address` query

## [2.15.1] - 2018-07-27
### Fixed
- `Update profile` mutation without custom fields.

## [2.15.0] - 2018-07-26
### Added
- `Login options` resolver.

## [2.14.0] - 2018-07-24
### Added
- Search resolver

## [2.12.6] - 2018-07-19
### Changed
- Changes custFields names to reflect Profile in CacheID

### Added
- Adds cacheId to Profile Custom Fields

## [2.12.5] - 2018-07-18
### Changed
- Bringing `benefitsProduct` back, after upgrade `app-store` to use `vtex.store@1.x`.

## [2.12.3] - 2018-07-17
### Fixed
- Change property name banefitProduct to product

## [2.12.2] - 2018-07-17

## [2.12.1] - 2018-07-16
### Added
- `country` field to `address` query
### Fixed
- Circular benefit query.

## [2.12.0] - 2018-07-13
### Added
- Possibility to extend profile info according to masterdata CL entity
- Adding file upload to Masterdata CL entity

## [2.11.1] - 2018-7-6
### Fixed
- Resolve null fields of product data in benefits resolver.

## [2.11.0] - 2018-7-4
### Added
- `OAuth` Resolver.
- Support for product retrievement into benefits resolver.

### Fixed
- Recommendations of product query to retrieve different products.

## [2.10.0] - 2018-7-4
### Added
- PriceRanges to facets graphql type

## [2.9.3] - 2018-7-2
### Fixed
- Benefits resolver was breaking with the returned data being null.

## [2.9.2] - 2018-7-2
### Added
- Added cacheId field to root types.

## [2.9.1] - 2018-6-27
### Fixed
- Fixed bug in `logout` mutation that didn't log out correctly.

## [2.9.0] - 2018-6-26
### Added
- Add `recoveryPassword` mutation in auth resolver.

## [2.8.0] - 2018-6-25
### Added
- Add classic login mutation.

### Changed
- Refact auth resolver.

## [2.7.2] - 2018-6-20

### Fixed
- Fix products search query only adding a category if there is not a search term.

## [2.7.1] - 2018-6-20
### Fixed
- Fix `vtexId` use on `paths.ts`.

## [2.7.0] - 2018-6-19
### Added
- Add documentation in `graphql` files.

### Changed
- Refact paths and organize API docs.
- Profile Query will return the user email in case of data not found.

### Fixed
- Fix `profile resolver` to use ioContext authToken.

## [2.6.1] - 2018-6-15
### Fixed
- Set the `maxAge` received from VTEXID to `VtexIdclientAutCookie_${account}` in `accessKeySigIn` mutation.

## [2.6.0] - 2018-6-15

### Added
- Create the logout mutation.

## [2.5.2] - 2018-6-14
### Fixed
- Fix `recommendations` field resolver.

## [2.5.1] - 2018-6-8
### Fixed
- Remove `VtexTemporarySession` to AuthInput.

## [2.5.0] - 2018-6-8

### Added
- Sets cache hints to schema root fields

### Fixed
- Fix profile query to reflect changes that were made in auth resolver.
- Fix authentication resolver to sign in only account users.

## [2.4.2]
### Changed
- Changed `shipping` query to perform freight simulation correctly.

### Fixed
- Fixed `profile` query permissions to read masterdata private fields

## [2.3.3] - 2018-04-10
### Added
- **Resolver** Add to the `autocomplete` query the `slug` property

### Changed
- **Resolver** Change the `OrderForm` query to parse the integer prices to float.

## [2.3.2] - 2018-04-05
### Fixed
- **Path** Product path was missing specification field.

## [2.3.1] - 2018-05-03
### Added
- Add `map` param to the `products` query

### Fixed
- Fix the `products` query to reject invalid characters

## [2.1.0] - 2018-09-04
### Added
- Add `map` param to the `products` query

### Fixed
- Fix the `products` query to reject invalid characters

## [2.3.0] - 2018-04-27
### Added
- **Product Query** Add `productClusters` to the `product` query

## [2.2.0] - 2018-04-16
### Added
- **Resolver** Create `documentResolver` to provide `create`, `retrieve` and `update` Documents.
- **Resolver** Create `brands` resolver to provide all brands from store.
### Changed
- **Resolver** Fix `authResolver` to set `HTTPOnly` on cookies.

## [2.1.0] - 2018-04-09
### Added
- **Resolver** Login resolver to provide GraphQL queries and mutations.
