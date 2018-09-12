import { RESTDataSource } from 'apollo-datasource-rest'
import { IOContext } from 'colossus'
import { forEachObjIndexed } from 'ramda'
import { withAuthToken } from '../resolvers/headers'
import paths from '../resolvers/paths'

interface AutocompleteArgs {
  maxRows: string
  searchTerm: string
}

export class PortalDataSource extends RESTDataSource<IOContext> {
  constructor(private ctx: IOContext) {
    super()
    this.baseURL = paths.portal
  }

  public autocomplete = (args: AutocompleteArgs) => this.get(paths.autocomplete(this.ctx.account, args))

  protected willSendRequest (request) {
    forEachObjIndexed(
      (value, header) => request.headers.set(header, value),
      withAuthToken(request.header)(this.ctx)
    )
  }
}
