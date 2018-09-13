import { RESTDataSource } from 'apollo-datasource-rest'
import { IOContext } from 'colossus'
import { forEachObjIndexed } from 'ramda'
import { withAuthToken } from '../resolvers/headers'

interface AutocompleteArgs {
  maxRows: string
  searchTerm: string
}

const isPlatformGC = account => account.indexOf('gc_') === 0 || account.indexOf('gc-') === 0

export class PortalDataSource extends RESTDataSource<IOContext> {
  constructor() {
    super()
  }

  public autocomplete = ({maxRows, searchTerm}: AutocompleteArgs) => this.get(
    `/?maxRows=${maxRows}&productNameContains=${encodeURIComponent(searchTerm)}`
  )

  get baseURL() {
    const {account} = this.context
    return isPlatformGC(account)
      ? `http://api.gocommerce.com/${account}/search/buscaautocomplete`
      : `http://${account}.vtexcommercestable.com.br/buscaautocomplete`
  }

  protected willSendRequest (request) {
    forEachObjIndexed(
      (value, header) => request.headers.set(header, value),
      withAuthToken(request.header)(this.context)
    )
  }
}
