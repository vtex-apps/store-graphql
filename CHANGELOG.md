# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.62.6] - 2020-07-27
### Added
- Set a header to ignore circuit breaker when proxying an error response status from a resolver.

## [1.62.5] - 2020-07-24
### Changed
- Increase max replicas from 150 to 250.

## [1.62.4] - 2020-07-13
### Changed
- Increase file upload limit from 4 to 10 MB.

## [1.62.3] - 2020-06-11
### Fixed
- CORS Gate hosts comparison.

## [1.62.2] - 2020-06-10 (deprecated)
### Added
- CORS Gate.

## [1.62.0] - 2020-05-22
### Added
- Whitelisted CORS only.

## [1.61.6] - 2020-05-21
### Fixed
- Bug when variable type name was causing conflicts and breaking queries.

## [1.61.5] - 2020-05-19
### Fixed
- Fix bad vary forward.

## [1.61.4] - 2020-05-08
### Removed
- Origin header logs.

## [1.61.3] - 2020-05-06
### Added
- Origin header logs.

## [1.61.2] - 2020-04-27
### Changed
- Remove getAppsMetaInfos stale cache.

## [1.61.1] - 2020-04-20
### Fixed
- Always use the depTree passed by render-server

## [1.61.0] - 2020-04-16
### Added
- Add graphql private route with the same handler as the extensible one.

## [1.60.1] - 2020-04-13
### Fixed
- Fix undefined `logger`.

## [1.60.0] - 2020-04-09
### Added
- Support for get with body
- Only installed apps can provide implementation for another app graphql schema.

## [1.59.0] - 2020-03-19
### Added
- Support for graphQL schema import cross apps

## [1.58.1] - 2020-02-13
### Changed
- Remove fallback log

## [1.58.0] - 2019-12-20

## [1.57.0] - 2019-12-19
### Added
- Resolve and expose binding information just like render-server

## [1.56.0] - 2019-12-19
### Fixed
- Use previous interface for errors but exclude `stack` for prodution
### Changed
- Migrates to node 6.x

## [1.55.2] - 2019-12-17
### Fixed
- `Errors` should be an array

## [1.55.1] - 2019-12-17
### Fixed
- Return only `operationId` in error middleware in production

## [1.55.0] - 2019-12-06
### Added
- Forward binding data

## [1.54.0] - 2019-12-05
### Changed
- receives single depTree

## [1.53.2] - 2019-11-28
### Added
- Uses assets client instead of settings client

## [1.53.1] - 2019-11-25

## [1.53.0] - 2019-11-25
### Changed
- Uses app's major in dep tree instead of exact version for generating schema

## [1.52.1] - 2019-11-13

## [1.52.0] - 2019-11-11
### Removed
- Remove cors from OPTIONS and GET

## [1.51.0] - 2019-11-05
### Changed
- Uses new path for persisted query json

## [1.50.3] - 2019-10-25

## [1.50.2] - 2019-10-24
### Fixed
- Fix pruneDependencies for GraphiQL

## [1.50.1] - 2019-10-22

## [1.50.0] - 2019-10-18
### Added
- migrated all cacheHints logic from `pages-graphql`

## [1.49.2] - 2019-10-17

## [1.49.1] - 2019-10-17
### Fixed
- Removed smartcache from meta route since it is immutable

## [1.49.0] - 2019-10-16

## [1.48.4] - 2019-10-11

## [1.48.3] - 2019-10-11

## [1.48.2] - 2019-10-10

## [1.48.1] - 2019-10-04

## [1.48.0] - 2019-10-03

## [1.47.5] - 2019-09-25

## [1.47.4] - 2019-09-25

### Fixed

 - adds outbound-access policies to vtexcommercebeta in api/session calls.

## [1.47.3] - 2019-09-24

## [1.47.2] - 2019-09-24

## [1.47.1] - 2019-09-24

## [1.47.0] - 2019-09-24

## [1.46.0] - 2019-09-24

## [1.44.3] - 2019-09-20

## [1.44.2] - 2019-09-16
### Changed
- Decrease min replicas

## [1.44.1] - 2019-09-13
### Changed
- Get public domains from `@vtex/api`

## [1.44.0] - 2019-09-03

## [1.43.0] - 2019-08-30

## [1.42.2] - 2019-08-30

## [1.42.1] - 2019-08-22

## [1.42.0] - 2019-08-12
### Added
- Forward locale in querystring as a header

## [1.41.0] - 2019-08-09

## [1.40.0] - 2019-08-09

## [1.39.1] - 2019-07-30
Fix problem with "senderApp" query

## [1.39.0] - 2019-07-29

## [1.38.2] - 2019-07-26

## [1.38.1] - 2019-07-25

## [1.38.0] - 2019-07-25

## [1.37.0] - 2019-07-08

## [1.36.0] - 2019-07-02

## [1.35.0] - 2019-07-02

## [1.34.1] - 2019-06-03

## [1.34.0] - 2019-06-03

## [1.32.0] - 2019-05-28

## [1.31.0] - 2019-05-27

## [1.30.0] - 2019-05-20

## [1.29.2] - 2019-05-16

## [1.29.1] - 2019-05-13

## [1.29.0] - 2019-05-01

## [1.28.0] - 2019-05-01

## [1.27.0] - 2019-04-26

## [1.26.0] - 2019-04-09

## [1.26.0-beta.1] - 2019-04-09

## [1.25.1] - 2019-03-28

## [1.25.0] - 2019-03-07

## [1.24.2] - 2019-02-22
### Added
- New metrics while fetching persisted query map

## [1.24.1] - 2019-02-22
### Added
- New performance metrics for the heaviest middlewares

## [1.24.0] - 2019-02-21

## [1.23.0] - 2019-02-20

## [1.22.0] - 2019-02-20
### Changes
- Increase timeout to 60s

## [1.21.1] - 2019-02-15

## [1.21.0] - 2019-02-11

## [1.20.2] - 2019-02-07

## [1.20.1] - 2019-02-07

## [1.20.0] - 2019-02-01

## [1.19.0] - 2019-01-15
### Added
- vary on SEGMENT scoped field query resolvers

## [1.18.1] - 2018-12-18
### Changed
- Release with IO CI instead of postreleasy hook

### Added
- CHANGELOG.md
