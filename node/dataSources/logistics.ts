import { RequestOptions } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

import { LogisticOuput } from '../resolvers/logistics/types'
import { RESTDataSource } from './RESTDataSource'

const DEFAULT_TIMEOUT_MS = 4 * 1000

const getBaseUrl = (account: string) => `http://${account}.vtexcommercestable.com.br/api/logistics`

export class LogisticsDataSource extends RESTDataSource {
  public pickupById = (id: string) => {
    const { vtex: { account } } = this.context
    return this.get(
      `${getBaseUrl('logistics')}/pvt/configuration/pickuppoints/${id}?an=${account}`,
      undefined,
      {metric: 'logistics-pickupById'}
    )
  }

  public nearPickupPoints = (lat: string, long: string, maxDistance = 50): Promise<LogisticOuput> => {
    const { vtex: { account } } = this.context
    return this.get(
      `${getBaseUrl('logistics')}/pvt/configuration/pickuppoints/_search?an=${account}&page=1&pageSize=100&lat=${lat}&$lon=${long}&maxDistance=${maxDistance}`,
      undefined,
      {metric: 'logistics-nearPickupPoints'}
    )
  }

  public shipping = () => {
    const { vtex: { account } } = this.context
    return this.get(
      `${getBaseUrl(account)}/pub/shipping/configuration`,
      undefined,
      {metric: 'logistics-shipping'}
    )
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
