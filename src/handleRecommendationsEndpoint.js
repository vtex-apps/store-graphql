import http from 'axios'
import Promise from 'bluebird'
import parse from 'co-body'
import {reject, isNil, prop} from 'ramda'
import paths from './paths'

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

export default {
  post: async (req, res, ctx) => {
    const body = await parse.json(req)
    const id = body.root.id

    const [prodViews, prodBuy] = await Promise.all([
      http.get(paths.recommendation(ctx.account, {id, type: 'ProdView'})).then(prop('data')),
      http.get(paths.recommendation(ctx.account, {id, type: 'ProdBuy'})).then(prop('data')),
    ])
    const [buy, view] = await Promise.all([
      Promise.map(prodViews, getProductById(ctx.account)),
      Promise.map(prodBuy, getProductById(ctx.account)),
    ])

    res.set('Content-Type', 'application/json')
    res.status = 200
    res.body = {data: {
      buy: reject(isNil, buy),
      view: reject(isNil, view)
    }}
  }
}
