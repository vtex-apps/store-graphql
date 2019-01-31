import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

export class IdentityDataSource extends RESTDataSource<Context> {
  public getUserWithToken = (token: string) => {
    return this.get(`authenticated/user?authToken=${encodeURIComponent(token)}`)
  }

  get baseURL() {
    return `http://vtexid.vtex.com.br/api/vtexid/pub`
  }

  protected willSendRequest(request: RequestOptions) {
    const { vtex: { authToken } } = this.context

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        'Proxy-Authorization': authToken,
        'VtexIdClientAutCookie': authToken,
        'X-Vtex-Proxy-To': `http://vtexid.vtex.com.br`,
      }
    )
  }
}
