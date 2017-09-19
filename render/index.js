import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {compose, graphql} from 'react-apollo'

import query from './query.gql'

function Example ({data: {loading, products}}) {
  return (
    <section className="pl3 ph4-ns pv3-ns pr3 p0-ns">
      <div>
        <h1 className="font-display f2 f1-ns fw6 mt4 mb2">
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

const queryOptions = {
  options: {
    variables: {
      query: 'test',
    },
  },
}

export default graphql(query, queryOptions)(Example)
