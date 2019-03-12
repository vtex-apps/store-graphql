import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

const withVtexProxyTo: Modifier = (opts: ModOpts, {vtex: {account}}: Context) => {
  const {headers} = opts
  headers.set('X-Vtex-Proxy-To', `http://${account}.vtexcommercestable.com.br`)
  return opts
}

export class LicenseManagerDataSource extends OutboundDataSource<Context> {
  protected modifiers = [
    withOutboundAuth,
    withLegacyAppAuth,
    withVtexProxyTo,
  ]
  
  public getAccountId = () => {
    return this.http.get(`account`).then(data => data.id)
  }

  get baseURL() {
    const { vtex: { account } } = this.context

    return `http://${account}.vtexcommercestable.com.br/api/license-manager`
  }

  // protected willSendRequest(request: RequestOptions) {
  //   const { vtex: { authToken, account } } = this.context

  //   forEachObjIndexed(
  //     (value: string, header) => request.headers.set(header, value),
  //     {
  //       'Proxy-Authorization': authToken,
  //       'VtexIdClientAutCookie': authToken,
  //       'X-Vtex-Proxy-To': `http://${account}.vtexcommercestable.com.br`,
  //     }
  //   )
  // }
}
