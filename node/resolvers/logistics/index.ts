import paths from '../paths'
import { withAuthToken } from '../headers'
import httpResolver from '../httpResolver'

export const queries = {
  logistics: (_, args, config) =>
    httpResolver({
      headers: withAuthToken()(config.vtex),
      method: 'GET',
      url: account => paths.logistics(account).shipping,
    })(_, args, config),
}
