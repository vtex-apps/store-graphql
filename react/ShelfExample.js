import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Shelf from './components/Shelf'
import ErrorBoundary from './components/ErrorBoundary'

class ShelfExample extends Component {
  render() {
    return (
      <ErrorBoundary>
        <h1>Shelf Example</h1>
        <Shelf
          from={0} to={5}
          query="test"
          salesChannel={1}
          orderBy="OrderByTopSaleDESC"/>
      </ErrorBoundary>
    )
  }
}

ShelfExample.propTypes = {

}

export default ShelfExample
