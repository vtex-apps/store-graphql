import PropTypes from 'prop-types'
import { FormattedMessage } from 'react-intl'
import { graphql, gql } from 'react-apollo'
import JSONTree from 'react-json-tree'

function CategoriesExample({ data: { loading, categories } }) {
  return (
    <div>
      {loading && <FormattedMessage id="store-graphql.loading" />}
      {!loading && <JSONTree data={categories} invertTheme={false} />}
    </div>
  )
}

CategoriesExample.propTypes = {
  data: PropTypes.object,
}

const query = gql`
  query Categories {
    categories {
      href
      slug
      name
      children {
        href
        slug
        name
        children {
          href
          slug
          name
          children {
            href
            slug
            name
            children {
              href
              slug
              name
            }
          }
        }
      }
    }
  }
`

export default graphql(query)(CategoriesExample)
