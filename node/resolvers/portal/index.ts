export const resolvers = {
  siteConfigs: async (_: any, __: any, ctx: Context) => {
    const {
      clients: { portal },
      vtex: { account },
    } = ctx

    const sites = await portal.sites()

    const currentSite = sites.find((site: any) => site.siteName === account)

    try {
      return portal.siteConfig(currentSite ? currentSite.id : 'default')
    } catch (e) {
      ctx.clients.logger.info(
        JSON.stringify(currentSite),
        'portal-storegraphql-errors'
      )
      return null
    }
  },
}
