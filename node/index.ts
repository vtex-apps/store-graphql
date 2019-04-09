import './globals'

import { IOClients, LRUCache, Service } from '@vtex/api'

import { dataSources } from './dataSources'
import { schemaDirectives } from './directives'
import { resolvers } from './resolvers'

const TWO_SECONDS_MS =  2 * 1000
const FOUR_SECONDS_MS =  4 * 1000

const retryConfig = {
  retries: 1,
}

// Segments are small and immutable.
const MAX_SEGMENT_CACHE = 10000
const segmentCache = new LRUCache<string, any>({max: MAX_SEGMENT_CACHE})
metrics.trackCache('segment', segmentCache)

export { Runtime } from '@vtex/api'

export default new Service<IOClients, void, CustomContext>({
  clients: {
    options: {
      default: {
        retryConfig,
        timeout: FOUR_SECONDS_MS,
      },
      segment: {
        memoryCache: segmentCache,
        timeout: TWO_SECONDS_MS,
      }
    }
  },
  graphql: {
    dataSources,
    resolvers,
    schemaDirectives,
  }
})
