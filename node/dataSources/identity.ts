import { RequestOptions } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

import { RESTDataSource } from './RESTDataSource'

export interface DefaultUser {
  authStatus: string
}

export interface User extends DefaultUser {
  id: string
  // email
  user: string
  account: string
  // store, admin
  audience: string
}

export class IdentityDataSource extends RESTDataSource {
  public getUserWithToken = (token: string) => {
    const {
      vtex: { account },
    } = this.context

    return this.post<DefaultUser | User>(
      `credential/validate?an=${account}`,
      {
        token,
      },
      { metric: 'vtexid-getUserWithToken' }
    )
  }

  public get baseURL() {
    return 'http://portal.vtexcommercestable.com.br/api/vtexid'
  }

  protected willSendRequest(request: RequestOptions) {
    const {
      vtex: { authToken },
    } = this.context

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        'Proxy-Authorization': authToken,
        VtexIdClientAutCookie: authToken,
        'X-Vtex-Proxy-To': `http://portal.vtexcommercestable.com.br`,
      }
    )
  }
}
