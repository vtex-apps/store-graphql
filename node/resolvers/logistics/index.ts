import { headers, withAuthToken } from '../headers'
import httpResolver from '../httpResolver'
import paths from '../paths'

export const queries = {
  logistics: httpResolver({
    headers: withAuthToken(headers.json),
    method: 'GET',
    url: account => paths.logisticsConfig(account).shipping,
  }),
}
