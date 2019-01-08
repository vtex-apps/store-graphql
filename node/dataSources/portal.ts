import { OutboundDataSource, withAuth, withLegacyUserAuth, withOutboundAuth, withTimeout } from '@vtex/api'

const DEFAULT_TIMEOUT_MS = 4 * 1000

interface AutocompleteArgs {
  maxRows: string
  searchTerm: string
}

const isPlatformGC = account => account.indexOf('gc_') === 0 || account.indexOf('gc-') === 0

export class PortalDataSource extends OutboundDataSource<Context> {
  protected modifiers = [
    withTimeout(DEFAULT_TIMEOUT_MS),
    withAuth,
    withOutboundAuth,
    withLegacyUserAuth
  ]

  public autocomplete = ({maxRows, searchTerm}: AutocompleteArgs) => this.get(
    `/?maxRows=${maxRows}&productNameContains=${encodeURIComponent(searchTerm)}`
  )

  get baseURL() {
    const {vtex: {account}} = this.context
    return isPlatformGC(account)
      ? `http://api.gocommerce.com/${account}/search/buscaautocomplete`
      : `http://${account}.vtexcommercestable.com.br/buscaautocomplete`
  }
}
