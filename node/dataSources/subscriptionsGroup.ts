import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

interface RetryArgs {
  orderGroup: string
  instanceId: string
  workflowId: string
}

export class SubscriptionsGroupDataSource extends RESTDataSource<Context> {
  public retry = ({ orderGroup, instanceId, workflowId }: RetryArgs) => {
    return this.post(`${orderGroup}/instances/${instanceId}/workflow/${workflowId}/retry`)
  }

  get baseURL() {
    const { vtex: { account } } = this.context

    return `http://${account}.vtexcommercestable.com.br/api/rns/subscriptions-group`
  }

  protected willSendRequest(request: RequestOptions) {
    const { cookies, vtex: { account, authToken } } = this.context
    const client = cookies.get('VtexIdclientAutCookie')

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        'Cookie': `VtexIdClientAutCookie=${client}`,
        'Proxy-Authorization': authToken,
        'X-Vtex-Proxy-To': `https://${account}.vtexcommercestable.com.br`,
      }
    )
  }
}
