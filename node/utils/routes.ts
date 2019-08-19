import { Apps } from '@vtex/api'
import { pluck } from 'ramda'
import Route from 'route-parser'

const ROUTES_JSON_PATH = 'dist/vtex.store-graphql/build.json'

interface ContentTypeDefinition {
  internal: string
  canonical: string
}

const getRoutesJSON = async (apps: Apps) => {
  const metaInfos = await apps.getAppsMetaInfos('vtex.store-graphql')
  const appIds = pluck('id', metaInfos)
  const storeAppId = appIds.find((appId: string) => /^vtex\.store@/.test(appId))
  if (!storeAppId) {
    // THROW?
    // log
    return null
  }
  // CACHE
  return apps.getAppJSON(storeAppId, ROUTES_JSON_PATH, true) as Promise<Record<string, ContentTypeDefinition> | null>
}

export const getRoute = async (apps: Apps, scope: string, routeType: 'canonical' | 'internal', reverseObj: any = {}) => {
  const routesJSON = await getRoutesJSON(apps)
  if (!routesJSON || !routesJSON[scope] || !routesJSON[scope][routeType]) {
    //log
    return null
  }
  const route = new Route(routesJSON[scope][routeType])
  return route.reverse(reverseObj)
}
