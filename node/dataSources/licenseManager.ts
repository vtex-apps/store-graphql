import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

export class LicenseManagerDataSource extends RESTDataSource<Context> {
  public getAccountId = () => {
    return this.get(`account`).then(data => data.id)
  }

  get baseURL() {
    const { vtex: { account } } = this.context

    return `http://${account}.vtexcommercestable.com.br/api/license-manager`
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
