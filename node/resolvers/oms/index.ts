import { isUserLoggedIn } from '../../utils'

export const queries = {
  userLastOrder: (_, __, ctx) => {
    const {
      dataSources: { oms },
    } = ctx
    return isUserLoggedIn(ctx) ? oms.userLastOrder() : null
  },

  order: (_, { id }: { id: string }, { dataSources: { oms } }: Context) =>
    oms.order(id),
}
