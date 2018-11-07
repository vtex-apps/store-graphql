import http from 'axios'

import paths from '../paths'

const makeRequest = async (url, token, data?, method = 'GET') => http.request({
  data,
  headers: {
    'Proxy-Authorization': token,
    'VtexIdclientAutCookie': token
  },
  method,
  url,
})


export const queries = {
  subscriptionsCountByStatus: async (_, args, config) => {
    const { vtex: { account, authToken } } = config

    const where = `createdAt between ${args.initialDate} and ${args.endDate}`
    const schema = "bi-v1"
    const field = "status"
    const type = "count"
    const interval = "day"

    return await makeRequest(
      paths.subscriptionAggregations(account, { schema, where, field, type, interval }),
      authToken
    ).then(({ data: { result } }) => {
      return result.reduce((acc, item) => ({
        ...acc,
        [item.key]: item.value,
      }), {
          active: 0,
          canceled: 0,
          paused: 0,
        })
    })
  }
}