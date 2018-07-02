# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
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
