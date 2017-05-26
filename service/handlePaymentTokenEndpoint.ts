import {merge, reject, propEq, last} from 'ramda'
import paths from './paths'
import http from 'axios'

const createClient = (account, orderFormId, authToken) => {

  const headers = {
    Authorization: `bearer ${authToken}`,
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
  const {data: {orderFormId, paymentToken}} = body
  const checkout = createClient(ctx.account, orderFormId, ctx.authToken)

  const response = await checkout.addToken(paymentToken)

  const {data: {paymentData: {availableTokens}}} = response
  const tokensToRemove = reject(propEq('tokenId', paymentToken.tokenId), availableTokens)

  if (tokensToRemove.length === 0) {
    return {data: merge(body.data, response.data)}
  }

  const lastDeleteResponse = await Promise.mapSeries(tokensToRemove, ({tokenId}) => checkout.removeToken(tokenId)).then(last)
  return {data: merge(body.data, lastDeleteResponse['data'])}
}
