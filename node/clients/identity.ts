import { ExternalClient, IOContext, InstanceOptions } from '@vtex/api'

export interface DefaultUser {
  authStatus: string
}

export interface User extends DefaultUser {
  id: string
  user: string
  customerId: string
  account: string
  audience: string
}

export class IdentityClient extends ExternalClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super('http://portal.vtexcommercestable.com.br/api/vtexid', context, {
      ...options,
      headers: {
        ...options?.headers,
        'X-Vtex-Proxy-To': 'http://portal.vtexcommercestable.com.br',
      },
    })
  }

  public getUserWithToken = (token: string) => {
    return this.http.post<DefaultUser | User>(
      `credential/validate?an=${this.context.account}`,
      { token },
      {
        headers: {
          'Proxy-Authorization': this.context.authToken,
          VtexIdClientAutCookie: this.context.authToken,
        },
        metric: 'vtexid-getUserWithToken',
      }
    )
  }
}
