import { OutboundDataSource, useHttps, withAuth, withLegacyAppAuth, withOutboundAuth } from '@vtex/api'

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
    withAuth,
    withOutboundAuth,
    withLegacyAppAuth,
    useHttps,
  ]

  public subscriptionsAggregations = ({ schema, where, field, type, interval }: AggregationsArgs) => {
    const { vtex: { account } } = this.context

    return this.get(
      `subscriptions/aggregations?an=${account}&_schema=${schema}&_where=${where}&_field=${field}&_type=${type}&_interval=${interval}`
    )
  }

  public getSubscriptionsOrders = ({ where, schema, fields }: SubscriptionsOrdersArgs) => {
    const { vtex: { account } } = this.context

    return this.get(
      `subscription_orders/search/?an=${account}&_fields=${fields}&_schema=${schema}${where ? `&_where=${where}` : ''}`)
  }

  public getSubscriptionsOrdersAggregations = ({ schema, where, field, type, interval }: AggregationsArgs) => {
    const { vtex: { account } } = this.context

    return this.get(
      `subscription_orders/aggregations?an=${account}&_schema=${schema}&_where=${where}&_field=${field}&_type=${type}&_interval=${interval}`)
  }

  get baseURL() {
    return `http://api.vtex.com/api/dataentities`
  }
}
