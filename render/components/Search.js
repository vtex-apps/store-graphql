import PropTypes from 'prop-types'
import { FormattedMessage } from 'react-intl'
import { graphql, gql } from 'react-apollo'
import JSONTree from 'react-json-tree'

function SearchExample({ data: { loading, search } }) {
  return (
    <div>
      {loading && <FormattedMessage id="store-graphql.loading" />}
      {!loading && <JSONTree data={search} invertTheme={false} />}
    </div>
  )
}

SearchExample.propTypes = {
  data: PropTypes.object,
}

const query = gql`
  query Search($query: String) {
    search(query: $query) {
			productId
			productName
			brand
			linkText
			productReference
			categoryId
			categories
			categoriesIds
			link
			description
			items {
				itemId
				name
				nameComplete
				complementName
				ean
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
					}
				}
				variations
			}
			properties {
				name
				values
			}
    }
  }
`

const options = {
  options: ({query = ''}) => ({
    variables: {query},
  }),
}

export default graphql(query, options)(SearchExample)
