const SUBSCRIPTION_ORDERS_SCHEMA = "subscription_orders-v1"
const SUBSCRIPTION_SCHEMA = 'bi-v1'

export const queries = {
  subscriptionsCountByStatus: async (_, args, { dataSources: { subscription } }) => {
    const options = {
      field: 'status',
      interval: 'day',
      schema: SUBSCRIPTION_SCHEMA,
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

  listSubscriptionOrdersByStatus: async (_, args, { dataSources: { subscription } }) => {

    let where
    switch (args.status) {
      case "SUCCESSFUL":
        where = `(status=SUCCESS OR status=SUCCESS_WITH_NO_ORDER OR status=SUCCESS_WITH_PARTIAL_ORDER) AND (date between ${args.initialDate} and ${args.endDate})`
        break
      case "ERROR":
        where = `(status=FAILURE OR status=ORDER_ERROR OR status=PAYMENT_ERROR) AND (date between ${args.initialDate} and ${args.endDate})`
        break
      case "ALL":
        where = `(date between ${args.initialDate} and ${args.endDate})`
        break
      default:
        where = `(status=${args.status}) AND (date between ${args.initialDate} and ${args.endDate})`
        break
    }

    const options = {
      where,
      schema: SUBSCRIPTION_ORDERS_SCHEMA,
      fields: "_all"
    }

    return subscription.getSubscriptionOrders(options)
  },

  subscriptionsOrdersCountByStatus: async (_, args, { dataSources: { subscription } }) => {
    const options = {
      field: 'status',
      interval: 'day',
      schema: SUBSCRIPTION_ORDERS_SCHEMA,
      type: 'count',
      where: `date between ${args.initialDate} and ${args.endDate}`
    }

    return subscription.getSubscriptionOrdersAggregations(options).then((data) => {
      return (data && data.result ? data.result : []).reduce((acc, item) => ({
        ...acc,
        [item.key]: item.value,
      }), {
          triggered: 0,
          "in_process": 0,
          "failure": 0,
          "success": 0,
          "expired": 0,
          "order_error": 0,
          "payment_error": 0,
          "skiped": 0,
          "success_with_no_order": 0,
          "success_with_partial_order": 0
        })
    })
  }
}