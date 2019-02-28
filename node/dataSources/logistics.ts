import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

import { LogisticOuput } from '../resolvers/logistics/types'

const DEFAULT_TIMEOUT_MS = 4 * 1000

const getBaseUrl = (account: string) => `http://${account}.vtexcommercestable.com.br/api/logistics`
export class LogisticsDataSource extends RESTDataSource<Context> {
  public pickupById = (id: string) => {
    const { vtex: { account } } = this.context
    return this.get(`${getBaseUrl('logistics')}/pvt/configuration/pickuppoints/${id}?an=${account}`)
  }

  public nearPickupPoints = (lat: string, long: string, maxDistance = 50): Promise<LogisticOuput> => {
    const { vtex: { account } } = this.context
    return this.get(`${getBaseUrl('logistics')}/pvt/configuration/pickuppoints/_search?an=${account}&page=1&pageSize=100&lat=${lat}&$lon=${long}&maxDistance=${maxDistance}`)
  }

  public shipping = () => {
    const { vtex: { account } } = this.context
    return this.get(`${getBaseUrl(account)}/pub/shipping/configuration`)
  }

  protected willSendRequest(request: RequestOptions) {
    const { vtex: { authToken }, request: { headers: { cookie } } } = this.context

    if (!request.timeout) {
      request.timeout = DEFAULT_TIMEOUT_MS
    }

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        'Cookie': cookie,
        'Proxy-Authorization': authToken,
        VtexIdclientAutCookie: authToken,
      }
    )
  }
}
