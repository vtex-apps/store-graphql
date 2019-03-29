import { isUserLoggedIn } from '../../utils'

export const queries = {
  userLastOrder: (_: any, __: any, ctx: any) => {
    const { dataSources: { oms } } = ctx
    return isUserLoggedIn(ctx) ? oms.userLastOrder() : null
  },

  order: (_: any, {id}: {id: string}, {dataSources: {oms}}: Context) => oms.order(id)
}
