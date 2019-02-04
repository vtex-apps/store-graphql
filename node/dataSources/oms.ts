import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import * as cookies from 'cookie'
import { forEachObjIndexed } from 'ramda'


export class OMSDataSource extends RESTDataSource<Context> {
  public lastUserOrder = () => this.get(`/user/orders/last`)

  get baseURL() {
    const { vtex: { account } } = this.context

    return `http://${account}.vtexcommercestable.com.br/api/oms`
  }

  protected willSendRequest(request: RequestOptions) {
    const { vtex: { authToken, account }, headers:{cookie} } = this.context

    const parsedCookie = cookies.parse(cookie)

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        'Proxy-Authorization': authToken,
        'VtexIdClientAutCookie': parsedCookie.VtexIdclientAutCookie,
        'X-Vtex-Proxy-To': `http://${account}.vtexcommercestable.com.br`,
      }
    )
  }
}
