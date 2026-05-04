import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'

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

const BASE_URL = 'http://portal.vtexcommercestable.com.br'

export class IdentityClient extends ExternalClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super(BASE_URL, context, {
      ...options,
      headers: {
        ...options?.headers,
        'X-Vtex-Proxy-To': BASE_URL,
      },
    })
  }

  public getUserWithToken = (token: string) =>
    this.http.post<DefaultUser | User>(
      `/api/vtexid/credential/validate?an=${this.context.account}`,
      { token },
      {
        headers: {
          'Proxy-Authorization': this.context.authToken ?? '',
          VtexIdClientAutCookie: this.context.authToken ?? '',
        },
        metric: 'vtexid-getUserWithToken',
      }
    )
}
