export const queries = {
  subscriptionsCountByStatus: async (_, args, { dataSources: { subscription } }) => {
    const options = {
      where: `createdAt between ${args.initialDate} and ${args.endDate}`,
      schema: "bi-v1",
      field: "status",
      type: "count",
      interval: "day"
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
  }
}