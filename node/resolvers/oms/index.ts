import { isUserLoggedIn } from '../../utils'

export const queries = {
  userLastOrder: (_: any, __: any, ctx: Context) => {
    const {
      clients: { oms },
    } = ctx

    return isUserLoggedIn(ctx) ? oms.userLastOrder() : null
  },

  order: (_: any, { id }: { id: string }, { clients: { oms } }: Context) =>
    oms.order(id),

  orders: async (_: any, __: any, context: Context) => {
    const {
      clients: { oms },
      vtex: { currentProfile },
    } = context

    return oms.orders(currentProfile)
  },
}

export const fieldResolvers = {
  OrderItemPaymentConnectorResponse: {
    additionalData: ({
      tid,
      returnCode,
      message,
      ...additionalData
    }: ConnectorResponse) => additionalData,
  },
}

interface ConnectorResponse {
  tid: string
  returnCode: string
  message: string
  [key: string]: string
}
