import React from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage } from 'react-intl'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import JSONTree from 'react-json-tree'

function ProductsExample({ data: { loading, products } }) {
  return (
    <div>
      {loading && <FormattedMessage id="store-graphql.loading" />}
      {!loading && <JSONTree data={products} invertTheme={false} />}
    </div>
  )
}

ProductsExample.propTypes = {
  data: PropTypes.object,
}

const query = gql`
  query Products(
    $query: String
    $category: String
    $specificationFilters: [String]
    $priceRange: String
    $collection: String
    $orderBy: String
    $from: Int
    $to: Int
  ) {
    products(
      query: $query
      category: $category
      specificationFilters: $specificationFilters
      priceRange: $priceRange
      collection: $collection
      orderBy: $orderBy
      from: $from
      to: $to
    ) {
      productId
      productName
      brand
      linkText
      productReference
      categoryId
      categories
      categoriesIds
      clusterHighlights {
        id
        name
      }
      link
      description
      items {
        itemId
        name
        nameComplete
        complementName
        ean
        referenceId {
          Key
          Value
        }
        measurementUnit
        unitMultiplier
        images {
          imageId
          imageLabel
          imageTag
          imageUrl
          imageText
        }
        sellers {
          sellerId
          sellerName
          addToCartLink
          sellerDefault
          commertialOffer {
            Installments {
              Value
              InterestRate
              TotalValuePlusInterestRate
              NumberOfInstallments
              PaymentSystemName
              PaymentSystemGroupName
              Name
            }
            Price
            ListPrice
            PriceWithoutDiscount
            RewardValue
            PriceValidUntil
            AvailableQuantity
            Tax
            CacheVersionUsedToCallCheckout
            DeliverySlaSamples {
              DeliverySlaPerTypes {
                TypeName
                Price
                EstimatedTimeSpanToDelivery
              }
              Region {
                IsPersisted
                IsRemoved
                Id
                Name
                CountryCode
                ZipCode
                CultureInfoName
              }
            }
          }
        }
        variations {
          name
          values
        }
        attachments {
          id
          name
          required
          domainValues {
            FieldName
            MaxCaracters
            DomainValues
          }
        }
      }
      properties {
        name
        values
      }
      propertyGroups {
        name
        properties
      }
      recommendations {
        buy {
          productId
          productName
        }
        view {
          productId
          productName
        }
      }
    }
  }
`

const options = {
  options: ({ query = '', category = '', specificationFilters = '', priceRange = '', collection = '', orderBy = '', from = 0, to = 10 }) => ({
    variables: {
      query,
      category,
      specificationFilters: specificationFilters?[specificationFilters]:[],
      priceRange,
      collection,
      orderBy,
      from,
      to
    },
  }),
}

export default graphql(query, options)(ProductsExample)
