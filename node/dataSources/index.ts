import { CatalogDataSource } from './catalog'
import { PortalDataSource } from './portal'

export const dataSources = () => ({
  catalog: new CatalogDataSource(),
  portal: new PortalDataSource()
})
