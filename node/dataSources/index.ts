import { LRUCache } from '@vtex/api'
import { CatalogDataSource } from './catalog'
import { PortalDataSource } from './portal'

export const dataSources = () => ({
  catalog: new CatalogDataSource(),
  portal: new PortalDataSource()
})

const cacheStorage = new LRUCache<string, any>({
  max: 200
})

export const cache = () => cacheStorage
