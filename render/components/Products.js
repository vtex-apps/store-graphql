import PropTypes from 'prop-types'
import { FormattedMessage } from 'react-intl'
import { graphql, gql } from 'react-apollo'
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
    $pageSize: Int
    $category: String
    $brands: String
    $collection: String
    $availableOnly: Boolean
    $sort: String
  ) {
    products(
      query: $query
      pageSize: $pageSize
      category: $category
      brands: $brands
      collection: $collection
      availableOnly: $availableOnly
      sort: $sort
    ) {
      brand {
        href
        description
        logo
        name
        slug
      }
      description
      id
      name
      skus {
        id
        name
        images {
          src
          title
        }
        offers {
          availability
          price
          listPrice
          validUntil
          seller {
            id
            name
          }
        }
        properties {
          facet {
            slug
            name
            values
          }
        }
      }
      recommendations {
        buy {
          id
          slug
        }
        view {
          id
          slug
        }
      }
      properties {
        facet {
          slug
          name
          values
        }
      }
      categories {
        href
        slug
        name
        children {
          href
          slug
          name
        }
      }
      slug
      measurement {
        unit
        multiplier
      }
    }
  }
`

const options = {
  options: ({
    query = 'test',
    pageSize = 12,
    category = '',
    brands = '',
    collection = '',
    availableOnly = false,
    sort = '',
  }) => ({
    variables: {
      query,
      pageSize,
      category,
      brands,
      collection,
      availableOnly,
      sort,
    },
  }),
}

export default graphql(query, options)(ProductsExample)
