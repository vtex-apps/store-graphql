import { LRUCache } from '@vtex/api'

import { CatalogDataSource } from './catalog'
import { CheckoutDataSource } from './checkout'
import { DocumentDataSource } from './document'
import { IdentityDataSource } from './identity'
import { LicenseManagerDataSource } from './licenseManager'
import { PaymentsDataSource } from './payments'
import { PortalDataSource } from './portal'
import { ProfileDataSource } from './profile'
import { SessionDataSource } from './session'
import { SubscriptionsDataSource } from './subscriptions'
import { SubscriptionsGroupDataSource } from './subscriptionsGroup'
import { TelemarketingDataSource } from './telemarketing'


const TEN_SECONDS_MS = 10 * 1000

export const dataSources = () => ({
  catalog: new CatalogDataSource(),
  checkout: new CheckoutDataSource(),
  document: new DocumentDataSource(),
  identity: new IdentityDataSource(),
  licenseManager: new LicenseManagerDataSource(),
  payments: new PaymentsDataSource(),
  portal: new PortalDataSource(),
  profile: new ProfileDataSource(),
  session: new SessionDataSource(),
  subscriptions: new SubscriptionsDataSource(),
  subscriptionsGroup: new SubscriptionsGroupDataSource(),
  telemarketing: new TelemarketingDataSource()
})

const cacheStorage = new LRUCache<string, any>({
  max: 200,
  maxAge: TEN_SECONDS_MS,
})

export const cache = () => cacheStorage
