import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {graphql, gql} from 'react-apollo'

function Example ({data: {loading, products}}) {
  return (
    <section className="pl3 ph4-ns pv3-ns pr3 p0-ns">
      <div>
        <h1 className="font-display f2 f1-ns fw6 mb2">
          <FormattedMessage id="extension-store.explore" />
        </h1>
      </div>
      {loading && "Carregando..."}
      {!loading && JSON.stringify(products)}
    </section>
  )
}

Example.propTypes = {
  data: PropTypes.object,
}

const query = gql`
query Products($query: String) {
  products(query: $query) {
    name
    slug
    description
  }
}`

const options = {
  options: {
    variables: {
      query: 'test',
    },
  },
}

export default graphql(query, options)(Example)
