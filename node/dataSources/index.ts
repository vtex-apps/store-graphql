import { LRUCache } from '@vtex/api'
import { CatalogDataSource } from './catalog'
import { CheckoutDataSource } from './checkout'
import { PortalDataSource } from './portal'
import { SessionDataSource } from './session'
import { SubscriptionDataSource } from './subscription'

export const dataSources = () => ({
  catalog: new CatalogDataSource(),
  checkout: new CheckoutDataSource(),
  portal: new PortalDataSource(),
  session: new SessionDataSource(),
  subscription: new SubscriptionDataSource()
})

const cacheStorage = new LRUCache<string, any>({
  max: 200
})

export const cache = () => cacheStorage
