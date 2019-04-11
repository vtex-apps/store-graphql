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
- [Mutations](#mutations)
  - [Checkout](#checkout)
  - [Profile System](#profile-system)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Usage

## Queries

### Catalog

`product` by slug
`products`
`facets`
`category`
`categories` tree of categories
`brand`

### Logistics 
`shipping`

### Checkout
`orderForm`

### OMS
`orders`

## Mutations

### Checkout

`addItem`
`updateItems`
`updateOrderFormProfile`
`updateOrderFormShipping`
`updateOrderFormPayment`
`updateOrderFormIgnoreProfile`
`addOrderFormPaymentToken`
`setOrderFormCustomData`
`createPaymentSession`
`createPaymentTokens`
`cancelOrder`

### Profile System

`createAddress`
`updateProfile`
`updateAddress`
`deleteAddress`

## Contributing

## Troubleshooting

You can check if others are passing through similar issues [here](https://github.com/vtex-apps/store-graphql/issues). Also feel free to [open issues](https://github.com/vtex-apps/store-graphql/issues/new).
