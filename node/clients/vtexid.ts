import { AppClient, InstanceOptions, IOContext } from '@vtex/api'

export interface AuthenticatedUserResponse {
  user: string
  userId: string
  locale: string
}

export class VtexId extends AppClient {
  private baseUrl = 'vtexid.vtex.com.br'

  constructor(ctx: IOContext, opts?: InstanceOptions) {
    super('vtexid', ctx, opts)
  }

  public getAuthenticatedUser = () => {
    const { storeUserAuthToken = '' } = this.context

    if (!storeUserAuthToken) {
      throw new Error('User is not authenticated')
    }

    return this.http.get<AuthenticatedUserResponse>(
      `http://${this.baseUrl}/api/vtexid/pub/authenticated/user?authToken=${storeUserAuthToken}`,
      {
        metric: 'vtexid-authenticated-user',
      }
    )
  }
}
