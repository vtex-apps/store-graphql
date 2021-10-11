import { RequestOptions } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

import { RESTDataSource } from './RESTDataSource'

export interface User {
  authStatus: string
  id?: string
  user?: string
  account?: string
  audience?: string
}

export class IdentityDataSource extends RESTDataSource {
  public getUserWithToken = ({
    token,
    account,
  }: {
    token: string
    account: string
  }) => {
    return this.post<User>(
      `credential/validate?an=${account}`,
      {
        token,
      },
      { metric: 'vtexid-getUserWithToken' }
    )
  }

  public get baseURL() {
    return 'http://api.vtexcommercestable.com.br/api/vtexid'
  }

  protected willSendRequest(request: RequestOptions) {
    const {
      vtex: { storeUserAuthToken },
    } = this.context

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        'Proxy-Authorization': storeUserAuthToken ?? '',
        VtexIdClientAutCookie: storeUserAuthToken ?? '',
        'X-Vtex-Proxy-To': `http://api.vtexcommercestable.com.br`,
      }
    )
  }
}
