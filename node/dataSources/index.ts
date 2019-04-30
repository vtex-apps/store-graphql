import { CatalogDataSource } from './catalog'
import { IdentityDataSource } from './identity'
import { LicenseManagerDataSource } from './licenseManager'
import { LogisticsDataSource } from './logistics'
import { OMSDataSource } from './oms'
import { ProfileDataSource } from './profile'
import { SessionDataSource } from './session'

export const dataSources = () => ({
  catalog: new CatalogDataSource(),
  identity: new IdentityDataSource(),
  licenseManager: new LicenseManagerDataSource(),
  logistics: new LogisticsDataSource(),
  oms: new OMSDataSource(),
  profile: new ProfileDataSource(undefined, { metrics }),
  session: new SessionDataSource(),
})
