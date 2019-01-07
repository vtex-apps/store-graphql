import { LRUCache } from '@vtex/api'
import { CatalogDataSource } from './catalog'
import { CheckoutDataSource } from './checkout'
import { DocumentDataSource } from './document'
import { PortalDataSource } from './portal'
import { SessionDataSource } from './session'
import { SubscriptionsDataSource } from './subscriptions'
import { SubscriptionsGroupDataSource } from './subscriptionsGroup'

const TEN_SECONDS_MS = 10 * 1000

export const dataSources = () => ({
  catalog: new CatalogDataSource(),
  checkout: new CheckoutDataSource(),
  document: new DocumentDataSource(),
  portal: new PortalDataSource(),
  session: new SessionDataSource(),
  subscriptions: new SubscriptionsDataSource(),
  subscriptionsGroup: new SubscriptionsGroupDataSource()
})

const cacheStorage = new LRUCache<string, any>({
  max: 200,
  maxAge: TEN_SECONDS_MS,
})

export const cache = () => cacheStorage
