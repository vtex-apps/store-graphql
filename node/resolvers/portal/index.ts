import { Site } from '../../clients/portal'

export const resolvers = {
  storeConfigs: async (_: any, __: any, ctx: Context) => {
    const {
      clients: { portal },
      vtex: { account, logger },
    } = ctx

    const sites = await portal.sites()

    const currentSite = (sites as Site[]).find(
      (site: Site) => site.siteName === account
    )

    try {
      return portal.storeConfigs(currentSite ? currentSite.id : 'default')
    } catch (e) {
      logger.info({
        message: JSON.stringify(currentSite),
        type: 'portal-storegraphql-errors'
      })
      return null
    }
  },
}
