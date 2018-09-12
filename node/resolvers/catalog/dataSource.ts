import { RESTDataSource } from 'apollo-datasource-rest'
import { IOContext } from 'colossus'
import { forEachObjIndexed } from 'ramda'
import { withAuthToken } from '../headers'
import paths from '../paths'

export class CatalogueDataSource extends RESTDataSource<IOContext> {
  constructor(private ctx: IOContext) {
    super()
    this.baseURL = paths.catalog(ctx.account)
  }

  public product = async (slug) => this.get(paths.product(slug))

  public products = async (args) => this.get(paths.products(args))

  protected willSendRequest = (request) => forEachObjIndexed(
    (value, header) => request.headers.set(header, value),
    withAuthToken(request.header)(this.ctx)
  )
}
