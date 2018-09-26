import axios from 'axios'
import {ColossusContext} from 'colossus'

const TEN_MINUTES_S = 10 * 60

const isPlatformGC = account => account.indexOf('gc_') === 0 || account.indexOf('gc-') === 0

export const catalogProxy = async (ctx: ColossusContext) => {
  const {vtex: {account, authToken, production, route: {params: {path}}}, headers: {cookie}, query} = ctx

  const baseURL = isPlatformGC(account)
    ? `http://api.gocommerce.com/${account}/search`
    : `http://${account}.vtexcommercestable.com.br/api/catalog_system`

  const {data} = await axios.request({
    baseURL,
    headers: {
      'Authorization': authToken,
      'Proxy-Authorization': authToken,
      ...cookie && {cookie},
    },
    params: query,
    url: path,
  })

  ctx.set('cache-control', production ? `public, max-age=${TEN_MINUTES_S}` : 'no-store, no-cache')
  ctx.body = data
}
