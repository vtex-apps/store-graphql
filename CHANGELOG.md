# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

<<<<<<< HEAD
## [2.3.1] - 2018-05-03
=======
## [2.3.1] - 2018-03-05

### Fixed

* **Path** Product path was missing specification field.

## [2.1.0] - 2018-09-04
>>>>>>> dae3092fe07efef6a8d882c7b4672339385852b0

### Added

* Added `map` param to the `products` query

### Fixed

* Fixed the `products` query to reject invalid characters

## [2.3.0] - 2018-04-27

### Added

* **Product Query** Add `productClusters` to the `product` query

## [2.2.0] - 2018-04-16

### Added

* **Resolver** Create `documentResolver` to provide `create`, `retrieve` and `update` Documents.
* **Resolver** Create `brands` resolver to provide all brands from store.

### Changed

* **Resolver** Fix `authResolver` to set `HTTPOnly` on cookies.

## [2.1.0] - 2018-04-09

### Added

* **Resolver** Login resolver to provide GraphQL queries and mutations.
