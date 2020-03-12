import { IdentityDataSource } from './identity'

export const dataSources = () => ({
  identity: new IdentityDataSource(),
})
