import paths from '../paths'
import { withAuthToken } from '../headers'
import httpResolver from '../httpResolver'

export const queries = {
  logistics: async (_, args, config) => {
    return await httpResolver({
      headers: withAuthToken()(config.vtex),
      method: 'GET',
      url: account => paths.logistics(account).shipping,
    })(_, args, config)
  },
}
