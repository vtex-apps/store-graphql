import { IdentityDataSource } from './identity'
import { LogisticsDataSource } from './logistics'
import { OMSDataSource } from './oms'
import { SessionDataSource } from './session'

export const dataSources = () => ({
  identity: new IdentityDataSource(),
  logistics: new LogisticsDataSource(),
  oms: new OMSDataSource(),
  session: new SessionDataSource(),
})
