import http from 'axios'
import {reject, isNil, prop} from 'ramda'
import paths from './paths'

Promise = require('bluebird')

const getProductById = account => async ({Target: id}) => {
  try {
    const config = {
      method: 'GET',
      url: paths.productById(account, {id}),
      headers: {accept: 'application/vnd.vtex.search-api.v0+json' },
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

export default async (body, ctx) => {
  const id = body.root.id

  const [prodViews, prodBuy] = await Promise.all<{Target: any}[], {Target: any}[]>([
    http.get(paths.recommendation(ctx.account, {id, type: 'ProdView'})).then(prop('data')),
    http.get(paths.recommendation(ctx.account, {id, type: 'ProdBuy'})).then(prop('data')),
  ])
  const [buy, view] = await Promise.all([
    Promise.map(prodViews, getProductById(ctx.account)),
    Promise.map(prodBuy, getProductById(ctx.account)),
  ])

  return {data: {
    buy: reject(isNil, buy),
    view: reject(isNil, view)
  }}
}
