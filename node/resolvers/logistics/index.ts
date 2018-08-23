import http from 'axios'
import paths from '../paths'

export const queries = {
  logistics: async (_, __, { vtex: ctx }) => {
    const config = {
      headers: {
        'Proxy-Authorization': ctx.authToken,
        vtexidclientautcookie: ctx.authToken,
      },
    }

    const response = await http.get(
      paths.logistics(ctx.account).shipping,
      config,
    )
    return response.data
  },
}
