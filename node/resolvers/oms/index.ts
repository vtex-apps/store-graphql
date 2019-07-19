import { isUserLoggedIn } from '../../utils'

export const queries = {
  userLastOrder: (_: any, __: any, ctx: Context) => {
    const { clients: { oms } } = ctx
    return isUserLoggedIn(ctx) ? oms.userLastOrder() : null
  },

  order: (_: any, { id }: { id: string }, { clients: { oms } }: Context) => oms.order(id)
}

export const fieldResolvers = {
  OrderItemPaymentConnectorResponse: {
    additionalData: ({ tid=null, returnCode=null, message=null, ...rest }) => rest
  }
}

