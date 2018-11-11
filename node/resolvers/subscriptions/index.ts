export const queries = {
  subscriptionsCountByStatus: async (_, args, { dataSources: { subscription } }) => {
    const options = {
      field: 'status',
      interval: 'day',
      schema: 'bi-v1',
      type: 'count',
      where: `createdAt between ${args.initialDate} and ${args.endDate}`,
    }

    return subscription.subscriptionAggregations(options).then((data) => {
      return (data && data.result ? data.result : []).reduce((acc, item) => ({
        ...acc,
        [item.key]: item.value,
      }), {
          active: 0,
          canceled: 0,
          paused: 0,
        })
    })
  },

  listSubscriptionOrders: async (_, args, { dataSources: { subscription } }) => {
    return subscription.getSubscriptionOrders()
  }
}