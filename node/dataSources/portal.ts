import { Functions } from '@gocommerce/utils'
import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'
import { withAuthToken } from '../resolvers/headers'

const DEFAULT_TIMEOUT_MS = 4 * 1000

interface AutocompleteArgs {
  maxRows: string
  searchTerm: string
}

const withPortalHeaders: Modifier = (opts: ModOpts, {vtex}: Context) => {
  const {headers} = opts
  forEachObjIndexed((value, key) => headers.set(key, value), withAuthToken(headers)(vtex))
  return opts
}

export class PortalDataSource extends OutboundDataSource<Context> {
  constructor() {
    super()
  }

  protected modifiers = [
    withTimeout(DEFAULT_TIMEOUT_MS),
    withPortalHeaders,
  ]

  public autocomplete = ({maxRows, searchTerm}: AutocompleteArgs) => this.http.get(
    `/?maxRows=${maxRows}&productNameContains=${encodeURIComponent(searchTerm)}`
  )

  get baseURL() {
    const {vtex: {account}} = this.context

    return Functions.isGoCommerceAcc(this.context)
      ? `http://api.gocommerce.com/${account}/search/buscaautocomplete`
      : `http://${account}.vtexcommercestable.com.br/buscaautocomplete`
  }

  // protected willSendRequest (request: RequestOptions) {
  //   if (!request.timeout) {
  //     request.timeout = DEFAULT_TIMEOUT_MS
  //   }

  //   forEachObjIndexed(
  //     (value: string, header) => request.headers.set(header, value),
  //     withAuthToken(request.headers)(this.context.vtex)
  //   )
  // }
}
