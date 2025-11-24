import { AppClient, InstanceOptions, IOContext } from '@vtex/api'

export interface AuthenticatedUserResponse {
  user: string
  userId: string
  locale: string
}

export interface AuthenticatedUserInfoResponse {
  id: string
  email: string
  name: string
  passwordLastUpdate: string | null
  organizationUnit: string | null
}

export class VtexId extends AppClient {
  private baseUrl = 'vtexid.vtex.com.br'

  constructor(ctx: IOContext, opts?: InstanceOptions) {
    super('vtexid', ctx, opts)
  }

  public getAuthenticatedUser = () => {
    const { storeUserAuthToken = '', account } = this.context

    if (!storeUserAuthToken) {
      throw new Error('User is not authenticated')
    }

    return this.http.get<AuthenticatedUserResponse>(
      `http://${this.baseUrl}/api/vtexid/user/info?an=${account}&scope=${account}`,
      {
        metric: 'vtexid-authenticated-user',
        headers: {
          Cookie: `VtexIdclientAutCookie_${account}=${storeUserAuthToken}`,
        },
      }
    )
  }
}
