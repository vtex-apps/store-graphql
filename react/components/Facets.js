import React from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage } from 'react-intl'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import JSONTree from 'react-json-tree'

function FacetsExample({ data: { loading, facets } }) {
  return (
    <div>
      {loading && <FormattedMessage id="store-graphql.loading" />}
      {!loading && <JSONTree data={facets} invertTheme={false} />}
    </div>
  )
}

FacetsExample.propTypes = {
  data: PropTypes.object,
}

const query = gql`
  query Facets($facets: String) {
    facets(facets: $facets) {
      Departments {
        Quantity
        Name
        Link
      }
      Brands {
        Quantity
        Name
        Link
      }
      SpecificationFilters {
        name
        facets {
          Quantity
          Name
          Link
        }
      }
      CategoriesTrees {
        Quantity
        Name
        Link
        Children {
          Link
        }
      }
    }
  }
`

const options = {options: ({facets = ''}) => ({ variables: { facets } })}

export default graphql(query, options)(FacetsExample)
