# VTEX Store GraphQL

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

## Troubleshooting

You can check if others are passing through similar issues [here](https://github.com/vtex-apps/store-graphql/issues). Also feel free to [open issues](https://github.com/vtex-apps/store-graphql/issues/new).
