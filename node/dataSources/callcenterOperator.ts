import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

interface IsValidCallcenterOperatorArgs {
  email: string
  accountId: string
}

export class CallcenterOperatorDataSource extends RESTDataSource<Context> {
  public isValidCallcenterOperator = ({ email, accountId }: IsValidCallcenterOperatorArgs) => {
    return this.get(`${accountId}/products/2/logins/${email}/resources/Televendas/granted?ignoreIsAdmin=False`)
  }

  get baseURL() {
    return `http://licensemanager.vtex.com.br/api/pvt/accounts`
  }

  protected willSendRequest(request: RequestOptions) {
    const { vtex: { authToken } } = this.context

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        'Proxy-Authorization': authToken,
        'VtexIdClientAutCookie': authToken,
        'X-Vtex-Proxy-To': `http://licensemanager.vtex.com.br`,
      }
    )
  }
}
