import { IdentityDataSource } from './identity'
import { LogisticsDataSource } from './logistics'
import { OMSDataSource } from './oms'

export const dataSources = () => ({
  identity: new IdentityDataSource(),
  logistics: new LogisticsDataSource(),
  oms: new OMSDataSource(),
})
