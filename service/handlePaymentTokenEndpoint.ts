import {merge, reject, propEq, last} from 'ramda'
import paths from './paths'
import http from 'axios'
import fetchVtexToken from './credentials'

const createClient = (account, orderFormId, {appToken, appKey}) => {

  const headers = {
    'x-vtex-api-appKey': appKey,
    'x-vtex-api-appToken': appToken,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  return {
    addToken: (paymentToken) => {
      const payload = {paymentToken, expectedOrderFormSections: ['items', 'paymentData']}
      const url = paths.orderFormPaymentToken(account, {orderFormId})

      return http.put(url, payload, {headers})
    },

    removeToken: (tokenId) => {
      const url = paths.orderFormPaymentTokenId(account, {orderFormId, tokenId})
      return http.delete(url, {headers, data: {expectedOrderFormSections: ['items']}})
    },
  }
}

export default async (body, ctx, req) => {
  const credentials = await fetchVtexToken(ctx, req.headers['x-vtex-id'])

  const {data: {orderFormId, paymentToken}} = body
  const checkout = createClient(ctx.account, orderFormId, credentials)

  const response = await checkout.addToken(paymentToken)

  const {data: {paymentData: {availableTokens}}} = response
  const tokensToRemove = reject(propEq('tokenId', paymentToken.tokenId), availableTokens)

  if (tokensToRemove.length === 0) {
    return {data: merge(body.data, response.data)}
  }

  const lastDeleteResponse = await Promise.mapSeries(tokensToRemove, ({tokenId}) => checkout.removeToken(tokenId)).then(last)
  return {data: merge(body.data, lastDeleteResponse['data'])}
}
