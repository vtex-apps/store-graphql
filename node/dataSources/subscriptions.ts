import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

interface AggregationsArgs {
  schema: string
  where: string
  field: string
  type: string
  interval: string
}

interface SubscriptionsOrdersArgs {
  where: string
  schema: string
  fields: string
}

export class SubscriptionsDataSource extends OutboundDataSource<Context> {
  protected modifiers = [
    withOutboundAuth,
    withLegacyAppAuth,
    withHeader('X-Vtex-Proxy-To', 'https://api.vtex.com'),
  ]
  
  public subscriptionsAggregations = ({ schema, where, field, type, interval }: AggregationsArgs) => {
    const { vtex: { account } } = this.context

    return this.http.get(
      `subscriptions/aggregations?an=${account}&_schema=${schema}&_where=${where}&_field=${field}&_type=${type}&_interval=${interval}`
    )
  }

  public getSubscriptionsOrders = ({ where, schema, fields }: SubscriptionsOrdersArgs) => {
    const { vtex: { account } } = this.context

    return this.http.get(
      `subscription_orders/search/?an=${account}&_fields=${fields}&_schema=${schema}${where ? `&_where=${where}` : ''}`)
  }

  public getSubscriptionsOrdersAggregations = ({ schema, where, field, type, interval }: AggregationsArgs) => {
    const { vtex: { account } } = this.context

    return this.http.get(
      `subscription_orders/aggregations?an=${account}&_schema=${schema}&_where=${where}&_field=${field}&_type=${type}&_interval=${interval}`)
  }

  get baseURL() {
    return `http://api.vtex.com/api/dataentities`
  }

  // protected willSendRequest(request: RequestOptions) {
  //   const { vtex: { authToken } } = this.context

  //   forEachObjIndexed(
  //     (value: string, header) => request.headers.set(header, value),
  //     {
  //       'Proxy-Authorization': authToken,
  //       'VtexIdclientAutCookie': authToken,
  //       'X-Vtex-Proxy-To': `https://api.vtex.com`,
  //     }
  //   )
  // }
}
