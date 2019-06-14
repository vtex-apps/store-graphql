# VTEX Store GraphQL
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors)

## Description

This project is a GraphQL API build in our [VTEX IO Platform](https://vtex.io/) as an abstraction of all VTEX public [REST API](https://help.vtex.com/developer-docs) that our commerce stores needed.

:loudspeaker: **Disclaimer:** Don't fork this project; use, contribute, or open issue with your feature request.

## Release schedule

| Release |       Status        | Initial Release | Maintenance LTS Start | End-of-life | 
| :-----: | :-----------------: | :-------------: | :-------------------: | :---------: | 
|  [2.x]  | **Current Release** |   2018-03-05    |                       |             |
|  [3.x]  | **Unscheduled**     |   ----------    |                       |             |

## Table of Content
- [Usage](#usage)
- [Queries](#queries)
  - [Catalog](#catalog) 
  - [Logistics](#logistics)
  - [Checkout](#checkout)
  - [OMS](#oms)
  - [Profile System](#profile-system)
- [Mutations](#mutations)
  - [Checkout](#checkout-1)
  - [Profile System](#profile-system-1)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Usage
TODO

## Queries

### Catalog

* `product` - Returns a specified product
* `products` - Returns products list filtered and ordered
* `facets` - Returns facets category
* `category` - Returns a specified category
* `categories` - Returns categories tree
* `brand` - Returns a specified brand
* `brands` - Returns brands list

### Logistics 
* `shipping` - Returns orderForm shipping simulation

### Checkout
* `orderForm` - Returns checkout cart details

### OMS
* `orders` - Returns user orders details
* `order` - Returns a specified user order

### Profile System
* `profile` - Returns user profile details

## Mutations

### Checkout

* `addItem`
* `updateItems` 
* `updateOrderFormProfile`
* `updateOrderFormShipping`
* `updateOrderFormPayment`
* `updateOrderFormIgnoreProfile`
* `addOrderFormPaymentToken`
* `setOrderFormCustomData`
* `createPaymentSession`
* `createPaymentTokens`
* `cancelOrder`

### Profile System

* `createAddress`
* `updateProfile`
* `updateAddress`
* `deleteAddress`

## Contributing
TODO 

## Troubleshooting

You can check if others are passing through similar issues [here](https://github.com/vtex-apps/store-graphql/issues). Also feel free to [open issues](https://github.com/vtex-apps/store-graphql/issues/new).

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="https://github.com/regis-samurai"><img src="https://avatars0.githubusercontent.com/u/38638226?v=4" width="100px;" alt="Reginaldo"/><br /><sub><b>Reginaldo</b></sub></a><br /><a href="https://github.com/vtex-apps/store-graphql/commits?author=regis-samurai" title="Code">💻</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!