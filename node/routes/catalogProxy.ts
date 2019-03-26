import { Functions } from '@gocommerce/utils'
import axios from 'axios'
import qs from 'qs'
import { keys } from 'ramda'

const TIMEOUT_MS = 7 * 1000
const MAX_AGE_S = 2 * 60
const STALE_IF_ERROR_S = 20 * 60

export const catalogProxy = async (ctx: Context) => {
  const {vtex: {account, authToken, production, route: {params: {path}}, segmentToken}, query, method} = ctx

  const isGoCommerce = Functions.isGoCommerceAcc(ctx)

  const [host, basePath] = isGoCommerce
    ? ['api.gocommerce.com', `${account}/search`]
    : [`${account}.vtexcommercestable.com.br`, 'api/catalog_system']

  const cookie = segmentToken && {Cookie: `vtex_segment=${segmentToken}`}
  const params = {
    ...query,
    segment: segmentToken,
  }

  const {data, headers, status} = await axios.request({
    baseURL: `http://${host}/${basePath}`,
    headers: {
      'Authorization': authToken,
      'Proxy-Authorization': authToken,
      'X-VTEX-Proxy-To': `https://${host}`,
      ...cookie,
    },
    method: isGoCommerce ? 'GET' : method,
    params,
    paramsSerializer: (p) => qs.stringify(p, {arrayFormat: 'repeat'}),
    timeout: TIMEOUT_MS,
    url: encodeURI((path as any).trim()),
  })

  keys(headers).forEach(headerKey => {
    ctx.set(headerKey, headers[headerKey])
  })

  ctx.vary('x-vtex-segment')
  ctx.status = status
  ctx.set('cache-control', production ? `public, max-age=${MAX_AGE_S}, stale-if-error=${STALE_IF_ERROR_S}` : 'no-store, no-cache')
  ctx.body = data
}
