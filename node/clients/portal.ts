import { InstanceOptions, IOContext, JanusClient } from '@vtex/api'

const portalPVT = '/api/portal/pvt'

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
    return {
      allSites: () => `${portalPVT}/sites/`,
      storeConfigs: (activeSite: string) =>
        `${portalPVT}/sites/${activeSite}/configuration`,
    }
  }
}