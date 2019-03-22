import { Functions } from '@gocommerce/utils'
import axios from 'axios'
import qs from 'qs'
import { keys } from 'ramda'

const TIMEOUT_MS = 7 * 1000
const MAX_AGE_S = 2 * 60
const STALE_IF_ERROR_S = 20 * 60

export const catalogProxy = async (ctx: Context) => {
<<<<<<< HEAD
  const {vtex: {account, authToken, production, route: {params: {path}}, segmentToken}, query, method} = ctx

  const isGoCommerce = Functions.isGoCommerceAcc(ctx)

  const [host, basePath] = isGoCommerce
=======
  const { vtex: { account, authToken, production, route: { params: { path } } }, headers: { cookie }, query } = ctx

  //TODO: REMOVER ANTES DE JOGAR NA MASTER
  const [host, basePath] = Functions.isGoCommerceAcc(ctx)
>>>>>>> Pass all the specificationGroups by graphql
    ? ['api.gocommerce.com', `${account}/search`]
    : [`${account}.vtexcommercebeta.com.br`, 'api/catalog_system']

<<<<<<< HEAD
  const cookie = segmentToken && {Cookie: `vtex_segment=${segmentToken}`}
  const params = {
    ...query,
    segment: segmentToken,
  }

  const {data, headers, status} = await axios.request({
=======
  const { data, headers } = await axios.request({
>>>>>>> Pass all the specificationGroups by graphql
    baseURL: `http://${host}/${basePath}`,
    headers: {
      'Authorization': authToken,
      'Proxy-Authorization': authToken,
      'X-VTEX-Proxy-To': `https://${host}`,
<<<<<<< HEAD
      ...cookie,
    },
    method: isGoCommerce ? 'GET' : method,
    params,
    paramsSerializer: (p) => qs.stringify(p, {arrayFormat: 'repeat'}),
=======
      ...cookie && { cookie },
    },
    params: query,
    paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
>>>>>>> Pass all the specificationGroups by graphql
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
