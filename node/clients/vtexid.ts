import { JanusClient } from '@vtex/api'

export interface AuthenticatedUserResponse {
  user: string
  userId: string
  locale: string
}

export class VtexId extends JanusClient {
  public getAuthenticatedUser = () => {
    const { storeUserAuthToken = '', account } = this.context

    if (!storeUserAuthToken) {
      throw new Error('User is not authenticated')
    }

    return this.http.get<AuthenticatedUserResponse>(`/api/vtexid/user/info`, {
      metric: 'vtexid-authenticated-user',
      headers: {
        Cookie: `VtexIdclientAutCookie_${account}=${storeUserAuthToken}`,
      },
      params: {
        scope: account,
      },
    })
  }
}
