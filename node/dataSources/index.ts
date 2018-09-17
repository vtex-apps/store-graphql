import { LRUCache } from '@vtex/api'
import { CatalogDataSource } from './catalog'
import { CheckoutDataSource } from './checkout'
import { PortalDataSource } from './portal'
import { SessionDataSource } from './session'

export const dataSources = () => ({
  catalog: new CatalogDataSource(),
  checkout: new CheckoutDataSource(),
  portal: new PortalDataSource(),
  session: new SessionDataSource(),
})

const cacheStorage = new LRUCache<string, any>({
  max: 200
})

export const cache = () => cacheStorage

export interface StoreGraphQLDataSources {
  catalog: CatalogDataSource
  checkout: CheckoutDataSource
  portal: PortalDataSource
  session: SessionDataSource
}
