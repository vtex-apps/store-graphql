import paths from './paths'
import Promise from 'bluebird'
import http from 'axios'
import { reject, isNil, prop } from 'ramda'

const getProductById = (account) => async ({Target: productId}) => {
  try {
    const config = {
      method: 'GET',
      url: paths(account).productById(productId),
      headers: { 'accept': 'application/vnd.vtex.search-api.v0+json' },
    }
    const {data} = await http.request(config)
    return data
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return null
    }
    throw err
  }
}

export default async ({id}, args, ctx) => {
  const [prodViews, prodBuy] = await Promise.all([
    http.get(paths(ctx.account).recommendation(id, 'ProdView')).then(prop('data')),
    http.get(paths(ctx.account).recommendation(id, 'ProdBuy')).then(prop('data')),
  ])
  const [buy, view] = await Promise.all([
    Promise.map(prodViews, getProductById(ctx.account)),
    Promise.map(prodBuy, getProductById(ctx.account)),
  ])
  return { buy: reject(isNil, buy), view: reject(isNil, view) }
}
