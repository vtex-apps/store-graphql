import { IdentityDataSource } from './identity'
import { LogisticsDataSource } from './logistics'

export const dataSources = () => ({
  identity: new IdentityDataSource(),
  logistics: new LogisticsDataSource(),
})
