import { RESTDataSource } from 'apollo-datasource-rest'
import { IOContext } from 'colossus'
import { forEachObjIndexed } from 'ramda'
import { withAuthToken } from '../resolvers/headers'

interface AutocompleteArgs {
  maxRows: string
  searchTerm: string
}

export class PortalDataSource extends RESTDataSource<IOContext> {
  constructor() {
    super()
    this.baseURL = 'http://portal.vtexcommercestable.com.br/buscaautocomplete'
  }

  public autocomplete = ({maxRows, searchTerm}: AutocompleteArgs) => this.get(
    `/?an=${this.context.account}&maxRows=${maxRows}&productNameContains=${encodeURIComponent(searchTerm)}`
  )

  protected willSendRequest (request) {
    forEachObjIndexed(
      (value, header) => request.headers.set(header, value),
      withAuthToken(request.header)(this.context)
    )
  }
}
