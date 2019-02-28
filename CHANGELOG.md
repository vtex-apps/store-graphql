# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.52.0] - 2019-02-28
### Added
- added pickupPoints query
- added updateOrderFormCheckin mutation

## [2.51.0] - 2019-02-27
### Added
- Create assembly options resolvers to `OrderFormItem`

## [2.50.3] - 2019-02-26

## [2.50.2] - 2019-02-26
### Changed
- Implement call to removeAssemblyOption on checkout data source
- Call it if passed assembly option with quantity 0

## [2.50.1] - 2019-02-25
### Fixed
- Headers' error in the `Document` dataSource.

## [2.50.0] - 2019-02-25
### Added
- Add logic to call addAssemblyOption to append assembly options to cart items

## [2.49.1] - 2019-02-22
### Fixed
- Fixes `Unexpected end of JSON input` errors in payments data source

## [2.49.0] - 2019-02-19

## [2.48.3] - 2019-02-14

### Added
- `address` on `Session` type

## [2.48.2] - 2019-02-14
### Fixed
- Fix `withCurrentProfile` directive, handling the case when the user is not signed in.

## [2.48.1] - 2019-02-12
### Fixed
- Fix cookie name in `isUserLoggedIn` function

## [2.48.0] - 2019-02-12
### Added
- Add `userLastOrder` query, fetching last logged in user order from OMS

## [2.47.1] - 2019-02-11
### Added
- Add assembly options fields to Order, OrderForm and Product types
- Create ItemMetadata type

## [2.47.0] - 2019-02-08

## [2.46.1] - 2019-02-04
### Added
- Add logic to sync orderFormId in cookies with session (soon to be implemented by checkout)
- Add logic to sync order form address with session (soon to be implemented by checkout)

## [2.46.0] - 2019-01-31
### Added
- `withCurrentProfile` to get the session that will be used on the profile related queries.

## [2.45.1] - 2019-01-30

## [2.44.3] - 2019-01-30
### Fixed
- Do not modify apollo request headers by overwritting the object

## [2.45.0] - 2019-01-16
### Changed
- Using new SEGMENT scoped directive

## [2.44.2] - 2019-01-14

### Added
- Add `currencyFormatInfo` on `storePreferencesData`, and its respective type.

## [2.44.1] - 2019-01-10
### Added
- @gocommerce/utils module to resolve if the current account is GoCommerce

## [2.44.0] - 2019-01-09
### Changed
- Upgrading node-vtex-api from 0.x to 1.x
- Removing unnecessary try..catch block in catalogProxy

## [2.43.2] - 2019-01-08

## [2.43.1] - 2019-01-08
### Changed
- Using IO/CI for releasing this repo

## [2.43.0] - 2019-01-07
### Added
- Add product list resolver.

## [2.42.0] - 2018-12-26
### Fixed
- Fix `seller` field type on OrderFormInput to accept strings as valid values
- Fix cart add on marketplace stores

## [2.41.3] - 2018-12-10
### Fixed
- `profileResolver`, now it is working for a impersonated customer.

## [2.41.2] - 2018-12-05
### Changed
- Changed min replicas to 6

## [2.41.1] - 2018-12-03
### Changed
- Removes custom axios config to avoid custom error handling.

## [2.41.0] - 2018-11-27
### Changed
- Update updateOrderFormShipping resolver and fix geoCoordinates field in address types

## [2.40.1] - 2018-11-23
### Fixed
- Use catalog proxy for total products API request.

### Changed
- Proxy all headers from catalog proxy.

## [2.40.0] - 2018-11-16
### Changed
- Isolate the query to `facets` and `products` from the search resolver.

## [2.39.1] - 2018-11-16

## [2.39.0] - 2018-11-14
### Added
- `SubscriptionOrders` resolvers

## [2.38.0] - 2018-11-09

## [2.37.0] - 2018-11-08
### Added
- Subscription resolvers

## [2.36.0] - 2018-11-08

## [2.35.1] - 2018-11-08

## [2.35.0] - 2018-11-7

## [2.34.4] - 2018-11-06

## [2.34.3] - 2018-11-6

## [2.34.2] - 2018-10-30
### Fixed
- canImpersonate of undefined
- reduce of undefined

## [2.34.1] - 2018-10-27
### Fixed
- Call catalog endpoint with HTTPS

## [2.34.0] - 2018-10-24
### Added
- Add `calculatedAttachments` resolver for the SKU.

## [2.33.0] - 2018-10-22
### Added
- Filtering of documents search with `where` param

### Fixed
- Creation of `VtexIdclientAutCookie` header

### Changed
- Using new @resolvers directive to set Vary http headers

## [2.32.3] - 2018-10-9
### Fixed
- Fix product search by slug returning no products because Catalog API is case-sensitive.

## [2.32.2] - 2018-10-09
### Changed
- Needs to have lint passing to publish store-graphql. If you are having problems publishing it, please remove the node_modules folder and run `yarn`

## [2.32.1] - 2018-10-5
### Fixed
- Add vary x-vtex-segment to prevent wrong cached responses.

## [2.32.0] - 2018-10-05
### Added
- Add `titleTag` and `metaTagDescription` in searchs for brand.

## [2.31.8] - 2018-10-03
### Fixed
- Add a regex in brand slug to remove special characters.

## [2.31.7] - 2018-10-02
### Fixed
- `updateOrderformShipping` passing of props in resolver and dataSource

## [2.31.6] - 2018-10-02
### Added
- `googleMapsKey` field on `LogisticsData` type

## [2.31.5] - 2018-10-01
### Changed
- Increased max replicas

## [2.31.4] - 2018-9-30

## [2.31.3] - 2018-09-28

## [2.31.2] - 2018-09-28
### Added
- Add OrderFormShippingData schema type

### Fixed
- Bug in updateOrderFormShipping resolver

## [2.31.1] - 2018-09-26
### Fixed
- Fix proxy catalog's querystring format

## [2.31.0] - 2018-09-26

### Changed
- Filter installments by criteria

## [2.30.2] - 2018-9-26
## Fixed
- Search term encoding

## [2.30.1] - 2018-09-26
## Fixed
- Search term cannot be nullable in search query

## [2.30.0] - 2018-9-24
## Changed
- Create an internal catalog proxy to cache responses on kube-router

## [2.29.3] - 2018-09-21
### Fixed
- Return email in `getSession` when a new user is logged.

## [2.29.2] - 2018-09-19
### Changed
- Change `email` to be a required field in `ProfileInput`.

## [2.29.1] - 2018-09-19
### Fixed
- Fix `updateProfile` mutation to update information of new users.

## [2.29.0] - 2018-9-17
### Changed
- Refact checkout resolvers to use dataSources
- Change catalog and checkout resolvers to account vtex_segment

## [2.28.1] - 2018-09-14
### Changed
- Using native support for dataSources

## [2.28.0] - 2018-09-13
### Changed
- Add dataSources to the catalogue API

## [2.27.1] - 2018-09-13
- Autocomplete working for GoCommerce

## [2.27.0] - 2018-09-12
### Fixed
- Argument type mismatch in url generation

### Changed
- Refactoring to use fields resolvers instead of manually parsing the fields

## [2.26.0] - 2018-09-05
### Added
- Add session query and remove initializeSession mutation.

## [2.25.4] - 2018-09-04
### Fixed
- Fix `/start` path of VTEX ID API.
### Changed
- Refact the auth mutations to make `POST` instead `GET` requests in API.

## [2.25.3] - 2018-08-31
### Added
- `isCorporate` field to ProfileInput

## [2.25.2] - 2018-08-30
### Added
- `isCorporate` field to Profile

## [2.25.1] - 2018-08-30
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
