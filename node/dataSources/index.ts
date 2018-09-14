import { LRUCache } from '@vtex/api'
import { CatalogDataSource } from './catalog'
import { CheckoutDataSource } from './checkout'
import { PortalDataSource } from './portal'

export const dataSources = () => ({
  catalog: new CatalogDataSource(),
  checkout: new CheckoutDataSource(),
  portal: new PortalDataSource()
})

const cacheStorage = new LRUCache<string, any>({
  max: 200
})

export const cache = () => cacheStorage

export interface StoreGraphQLDataSources {
  catalog: CatalogDataSource
  checkout: CheckoutDataSource
  portal: PortalDataSource
}
