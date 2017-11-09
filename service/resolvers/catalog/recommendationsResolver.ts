import http from 'axios'
import {isNil, prop, reject} from 'ramda'
import paths from '../paths'

const getProductById = account => async ({Target: id}) => {
  try {
    const config = {
      headers: {accept: 'application/vnd.vtex.search-api.v0+json' },
      method: 'GET',
      url: paths.productById(account, {id}),
    }
    const {data} = await http.request(config)
    return data[0]
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return null
    }
    throw err
  }
}

export default async (body, ioContext) => {
  const id = body.root.productId
  const [prodViews, prodBuy] = await Promise.all<Array<{Target: any}>, Array<{Target: any}>>([
    http.get(paths.recommendation(ioContext.account, {id, type: 'ProdView'})).then<any>(prop('data')),
    http.get(paths.recommendation(ioContext.account, {id, type: 'ProdBuy'})).then<any>(prop('data')),
  ])

  const [buy, view] = await Promise.all([
    Promise.map(prodViews, getProductById(ioContext.account)),
    Promise.map(prodBuy, getProductById(ioContext.account)),
  ])

  return {data: {
    buy: reject(isNil, buy),
    view: reject(isNil, view),
  }}
}
