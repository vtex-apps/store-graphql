import './global'

import { method, Service } from '@vtex/api'

import run from './middlewares/run'
import error from './middlewares/error'
import schema from './middlewares/schema'
import extract from './middlewares/extract'

export default new Service({
  routes: {
    graphql: method({
      GET: [error, extract, schema, run],
      POST: [error, extract, schema, run],
    }),
  },
})
