import React from 'react'
import { FormattedMessage } from 'react-intl'

const App = ({ children }) => (
  <main className="pl3 ph4-ns pv3-ns pr3 p0-ns">
    <h1 className="font-display f2 f1-ns fw6 mb2">
      <FormattedMessage id="store-graphql.title" />
    </h1>
    {children}
  </main>
)

export default App
