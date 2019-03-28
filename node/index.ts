import './globals'

import { IOClients, Service } from '@vtex/api'

import { dataSources } from './dataSources'
import { schemaDirectives } from './directives'
import { resolvers } from './resolvers'
import { catalogProxy } from './routes/catalogProxy'

const TWO_SECONDS_MS =  2 * 1000

const retryConfig = {
  retries: 1,
}

export default new Service<IOClients, void, CustomContext>({
  clients: {
    options: {
      default: {
        retryConfig,
        timeout: TWO_SECONDS_MS,
      },
    }
  },
  graphql: {
    dataSources,
    resolvers,
    schemaDirectives,
  },
  routes: {
    catalogProxy,
  }
})
