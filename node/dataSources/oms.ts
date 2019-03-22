import { RequestOptions } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

import { RESTDataSource } from './RESTDataSource'

const DEFAULT_TIMEOUT_MS = 4 * 1000

export class OMSDataSource extends RESTDataSource {
  public userLastOrder = () => this.get(
    'user/orders/last',
    undefined,
    {metric: 'oms-userLastOrder'}
  )

  public order = (id: string) => this.get(
    `/pvt/orders/${id}`,
    undefined,
    {metric: 'oms-order'}
  )

  public get baseURL() {
    const { vtex: { account } } = this.context
    return `http://${account}.vtexcommercestable.com.br/api/oms`
  }

  protected willSendRequest(request: RequestOptions) {
    const { vtex: { account, authToken }, request: { headers: { cookie } } } = this.context

    if (!request.timeout) {
      request.timeout = DEFAULT_TIMEOUT_MS
    }

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        'Cookie': cookie,
        'Proxy-Authorization': authToken,
        'X-Vtex-Proxy-To': `http://${account}.vtexcommercestable.com.br`,
      }
    )
  }
}
