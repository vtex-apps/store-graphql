import { OutboundDataSource, useHttps, withAuth, withLegacyUserAuth, withOutboundAuth } from '@vtex/api'

interface RetryArgs {
  orderGroup: string
  instanceId: string
  workflowId: string
}

export class SubscriptionsGroupDataSource extends OutboundDataSource<Context> {
  protected modifiers = [
    withAuth,
    withOutboundAuth,
    withLegacyUserAuth,
    useHttps,
  ]

  public retry = ({ orderGroup, instanceId, workflowId }: RetryArgs) => {
    return this.post(`${orderGroup}/instances/${instanceId}/workflow/${workflowId}/retry`)
  }

  get baseURL() {
    const { vtex: { account } } = this.context

    return `http://${account}.vtexcommercestable.com.br/api/rns/subscriptions-group`
  }
}
