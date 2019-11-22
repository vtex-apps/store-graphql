import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'

export class Identity extends ExternalClient {
  public constructor(ctx: IOContext, options?: InstanceOptions) {
    super(
      'http://vtexid.vtex.com.br/api/vtexid/pub',
      ctx,
      {
        ...options,
        headers: {
          ...(options && options.headers),
          VtexIdclientAutCookie: ctx.authToken,
          'X-Vtex-Use-Https': "true",
        },
      }
    )
  }

  public getUserWithToken = (token: string) => this.http.get(
    'authenticated/user',
    {
      params: {
        authToken: encodeURIComponent(token),
      },
      metric: 'vtexid-getUserWithToken'
    }
  )
}
