import { RequestOptions, RESTDataSource, Response } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

import { generateQueryParams, MasterDataArgs } from '../utils/masterDataQueryBuilders'

export class SubscriptionsDataSource extends RESTDataSource<ServiceContext> {
  public subscriptionsAggregations = (params: MasterDataArgs) => {
    const { vtex: { account } } = this.context

    return this.get(
      `subscriptions/aggregations?an=${account}${generateQueryParams(params)}`
    )
  }

  public subscriptionsOrdersAggregations = (params: MasterDataArgs) => {
    const { vtex: { account } } = this.context

    return this.get(
      `subscription_orders/aggregations?an=${account}${generateQueryParams(params)}`)
  }

  public getSubscriptionsOrders = (params: MasterDataArgs) => {
    const { vtex: { account } } = this.context

    return this.get(
      `subscription_orders/search/?an=${account}${generateQueryParams(params)}`)
  }

  public getSubscriptions = (params: MasterDataArgs) => {
    const { vtex: { account } } = this.context

    return this.get(
      `subscriptions/search/?an=${account}${generateQueryParams(params)}`)
  }

  protected async didReceiveResponse(response: Response) {
    const contentRange = response.headers.get("rest-content-range")
    const body = await response.json()

    if (contentRange) {
      const total = parseInt(contentRange.split('/')[1])
      return { result: body, total }
    } else {
      return { ...body }
    }
  }

  get baseURL() {
    return `http://api.vtex.com/api/dataentities`
  }

  protected willSendRequest(request: RequestOptions) {
    const { vtex: { authToken } } = this.context

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        'Proxy-Authorization': authToken,
        'VtexIdclientAutCookie': authToken,
        'X-Vtex-Proxy-To': `https://api.vtex.com`,
      }
    )
  }
}