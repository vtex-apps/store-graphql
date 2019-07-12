import './globals'

import { LRUCache, Service } from '@vtex/api'

import { Clients } from './clients'
import { dataSources } from './dataSources'
import { schemaDirectives } from './directives'
import { resolvers } from './resolvers'

const THREE_SECONDS_MS = 3 * 1000
const SIX_SECONDS_MS = 6 * 1000
const TEN_SECONDS_MS = 10 * 1000

// Segments are small and immutable.
const MAX_SEGMENT_CACHE = 10000
const segmentCache = new LRUCache<string, any>({ max: MAX_SEGMENT_CACHE })
const catalogCache = new LRUCache<string, any>({max: 2000})

metrics.trackCache('segment', segmentCache)
metrics.trackCache('catalog', catalogCache)

export { Runtime } from '@vtex/api'

export default new Service<Clients, void, CustomContext>({
  clients: {
    implementation: Clients,
    options: {
      checkout: {
        timeout: TEN_SECONDS_MS,
      },
      default: {
        retries: 2,
        timeout: THREE_SECONDS_MS,
      },
      segment: {
        memoryCache: segmentCache,
        timeout: THREE_SECONDS_MS,
      },
      catalog: {
        memoryCache: catalogCache,
        metrics,
        timeout: SIX_SECONDS_MS,
      }
    },
  },
  graphql: {
    dataSources,
    resolvers,
    schemaDirectives,
  },
})
