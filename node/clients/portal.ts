import { InstanceOptions, IOContext, JanusClient } from '@vtex/api'

export class Portal extends JanusClient {
  public constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...(options && options.headers),
        ...(ctx.authToken ? { VtexIdclientAutCookie: ctx.authToken } : null),
      },
    })
  }

  public sites = () =>
    this.http.get(this.routes.allSites(), { metric: 'portal-sites' })

  public storeConfigs = (activeSite: string) =>
    this.http.get(this.routes.storeConfigs(activeSite), {
      metric: 'portal-site-config',
    })

  private get routes() {
    const basePVT = '/api/portal/pvt'

    return {
      allSites: () => `${basePVT}/sites/`,
      storeConfigs: (activeSite: string) =>
        `${basePVT}/sites/${activeSite}/configuration`,
    }
  }
}
