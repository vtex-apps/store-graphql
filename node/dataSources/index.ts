import { LRUCache } from '@vtex/api'
import { AddressDataSource } from './address'
import { CatalogDataSource } from './catalog'
import { CheckoutDataSource } from './checkout'
import { PortalDataSource } from './portal'
import { ProfileSystemDataSource } from './profileSystem'
import { SessionDataSource } from './session'
import { UserDataSource } from './user'

export const dataSources = (): StoreGraphQLDataSources => ({
  address: new AddressDataSource(),
  catalog: new CatalogDataSource(),
  checkout: new CheckoutDataSource(),
  portal: new PortalDataSource(),
  profileSystem: new ProfileSystemDataSource(),
  session: new SessionDataSource(),
  user: new UserDataSource(),
})

const cacheStorage = new LRUCache<string, any>({
  max: 200
})

export const cache = () => cacheStorage
