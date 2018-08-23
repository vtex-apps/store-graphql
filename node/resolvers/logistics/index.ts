import paths from '../paths'
import { withAuthToken, headers } from '../headers'
import httpResolver from '../httpResolver'

export const queries = {
  logistics: httpResolver({
    headers: withAuthToken(headers.json),
    method: 'GET',
    url: account => paths.logisticsConfig(account).shipping,
  }),
}
