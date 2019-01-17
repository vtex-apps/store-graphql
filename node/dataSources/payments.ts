import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

export class PaymentsDataSource extends RESTDataSource<Context> {
  public getUserPayments = (userId: String) => {
    return this.get(`${userId}/vcs-checkout`)
  }

  get baseURL() {
    const { vtex: { account } } = this.context

    return `http://${account}.vtexcommercestable.com.br/api/profile-system/pvt/profiles`
  }

  protected willSendRequest(request: RequestOptions) {
    const { vtex: { authToken, account } } = this.context

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        'Proxy-Authorization': authToken,
        'VtexIdClientAutCookie': authToken,
        'X-Vtex-Proxy-To': `http://${account}.vtexcommercestable.com.br`,
      }
    )
  }
}
