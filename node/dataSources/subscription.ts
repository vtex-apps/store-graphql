import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'
import { headers, withAuthToken } from '../resolvers/headers'

interface AggregationsArgs {
  schema: string
  where: string
  field: string
  type: string
  interval: string
}

export class SubscriptionDataSource extends RESTDataSource<ServiceContext> {
  constructor() {
    super()
  }

  public subscriptionAggregations = ({ schema, where, field, type, interval }: AggregationsArgs) => {
    const { vtex: { account } } = this.context

    return this.get(
      `/aggregations?an=${account}&_schema=${schema}&_where=${where}&_field=${field}&_type=${type}&_interval=${interval}`
    )
  }

  get baseURL() {
    return `http://api.vtex.com/api/dataentities/subscriptions`
  }

  protected willSendRequest(request: RequestOptions) {
    const { vtex: { authToken } } = this.context

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        'Proxy-Authorization': authToken,
        'VtexIdclientAutCookie': authToken
      }
    )
  }
}