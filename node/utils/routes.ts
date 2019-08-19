import { pluck } from 'ramda'
import { LRUCache } from '@vtex/api'
import Route from 'route-parser'

const ROUTES_JSON_PATH = 'dist/vtex.store-graphql/build.json'

interface ContentTypeDefinition {
  internal: string
  canonical: string
}

const routesCache = new LRUCache<string, any>({max: 4000})
metrics.trackCache('routes JSON', routesCache)

const getRoutesJSON = async ({clients: {apps}, vtex: {logger}}: Context) => {
  const metaInfos = await apps.getAppsMetaInfos('vtex.store-graphql')
  const appIds = pluck('id', metaInfos)
  const storeAppId = appIds.find((appId: string) => /^vtex\.store@/.test(appId))
  if (!storeAppId) {
    logger.error({message:'vtex.store not found.'})
    return null
  }
  if (routesCache.has(storeAppId)) return routesCache.get(storeAppId)

  const routesJSON = await apps.getAppJSON(storeAppId, ROUTES_JSON_PATH, true) as Record<string, ContentTypeDefinition> | null

  routesCache.set(storeAppId, routesJSON)
  return routesJSON
}

export const getRoute = async (ctx: Context, scope: string, routeType: 'canonical' | 'internal', reverseObj: any = {}) => {
  const { vtex: { logger } } = ctx
  const routesJSON = await getRoutesJSON(ctx)
  if (!routesJSON || !routesJSON[scope] || !routesJSON[scope][routeType]) {
    logger.error(`routesJSON does not conform with params: ${scope} and ${routeType}.`)
    return null
  }
  const route = new Route(routesJSON[scope][routeType])
  return route.reverse(reverseObj)
}
