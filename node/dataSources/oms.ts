import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

const DEFAULT_TIMEOUT_MS = 4 * 1000

const withVtexProxyTo: Modifier = (opts: ModOpts, {vtex: {account}}: Context) => {
  const {headers} = opts
  headers.set('X-Vtex-Proxy-To', `http://${account}.vtexcommercestable.com.br`)
  return opts
}

export class OMSDataSource extends OutboundDataSource<Context> {
  protected modifier = [
    withTimeout(DEFAULT_TIMEOUT_MS),
    withCookies,
    withOutboundAuth,
    withVtexProxyTo,
  ]
  
  public userLastOrder = () => this.http.get('user/orders/last')

  public order = (id: string) => this.http.get(`/pvt/orders/${id}`)

  get baseURL() {
    const { vtex: { account } } = this.context
    return `http://${account}.vtexcommercestable.com.br/api/oms`
  }

  // protected willSendRequest(request: RequestOptions) {
  //   const { vtex: { account, authToken }, request: { headers: { cookie } } } = this.context

  //   if (!request.timeout) {
  //     request.timeout = DEFAULT_TIMEOUT_MS
  //   }

  //   forEachObjIndexed(
  //     (value: string, header) => request.headers.set(header, value),
  //     {
  //       'Cookie': cookie,
  //       'Proxy-Authorization': authToken,
  //       'X-Vtex-Proxy-To': `http://${account}.vtexcommercestable.com.br`,
  //     }
  //   )
  // }
}
