import './globals'

import { isNetworkErrorOrRouterTimeout, Service } from '@vtex/api'

import { dataSources } from './dataSources'
import { schemaDirectives } from './directives'
import { resolvers } from './resolvers'
import { catalogProxy } from './routes/catalogProxy'

// Retry on timeout from our end
const isAborted = (e: any) => {
  if (e && e.code === 'ECONNABORTED') {
    return true
  }
  return isNetworkErrorOrRouterTimeout(e)
}

const TWO_SECONDS_MS =  2 * 1000

const retryConfig = {
  retries: 1,
  retryCondition: isAborted,
  shouldResetTimeout: true,
}

const service = new Service({
  clients: {
    options: {
      default: {
        retryConfig,
        timeout: TWO_SECONDS_MS,
      },
    }
  },
  routes: {
    catalogProxy,
  }
})

;(service as any).graphql = {
  dataSources,
  resolvers,
  schemaDirectives,
}

export default service
