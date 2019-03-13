import { Functions } from '@gocommerce/utils'
import { RequestOptions } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

import { withAuthToken } from '../resolvers/headers'
import { RESTDataSource } from './RESTDataSource'

const DEFAULT_TIMEOUT_MS = 4 * 1000

interface AutocompleteArgs {
  maxRows: string
  searchTerm: string
}

export class PortalDataSource extends RESTDataSource {
  constructor() {
    super()
  }

  public autocomplete = ({maxRows, searchTerm}: AutocompleteArgs) => this.get(
    `/?maxRows=${maxRows}&productNameContains=${encodeURIComponent(searchTerm)}`,
    undefined,
    {metric: 'portal-autocomplete'}
  )

  get baseURL() {
    const {vtex: {account}} = this.context

    return Functions.isGoCommerceAcc(this.context)
      ? `http://api.gocommerce.com/${account}/search/buscaautocomplete`
      : `http://${account}.vtexcommercestable.com.br/buscaautocomplete`
  }

  protected willSendRequest (request: RequestOptions) {
    if (!request.timeout) {
      request.timeout = DEFAULT_TIMEOUT_MS
    }

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      withAuthToken(request.headers)(this.context.vtex)
    )
  }
}
