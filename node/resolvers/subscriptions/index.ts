const SUBSCRIPTION_ORDERS_SCHEMA = "subscription_orders-v1"
const SUBSCRIPTION_SCHEMA = 'bi-v1'

const generateTimeConstraint = (field, initialDate, endDate) => {
  return `${field} between ${initialDate} and ${endDate}`
}

const generateStatusConstraint = (statusList) => {
  let count
  return statusList.reduce((result, status) => {
    count++

    if (count == 1) return `status=${status}`

    return `${result} OR status=${status}`
  }, '')
}

const generateListWhere = (statusList, args) => {
  if (statusList.length == 0)
    return `(${generateTimeConstraint('date', args.initialDate, args.endDate)})`
  else
    return `(${generateStatusConstraint(statusList)}) AND (${generateTimeConstraint('date', args.initialDate, args.endDate)})`
}

export const queries = {
  subscriptionsCountByStatus: async (_, args, { dataSources: { subscription } }) => {
    const options = {
      field: 'status',
      interval: 'day',
      schema: SUBSCRIPTION_SCHEMA,
      type: 'count',
      where: generateTimeConstraint('createdAt', args.initialDate, args.endDate),
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
        where = generateListWhere(['SUCCESS', 'SUCCESS_WITH_NO_ORDER', 'SUCCESS_WITH_PARTIAL_ORDER'], args)
        break
      case "ERROR":
        where = generateListWhere(['FAILURE', 'ORDER_ERROR', 'PAYMENT_ERROR'], args)
        break
      case "ALL":
        where = generateListWhere([], args)
        break
      default:
        where = generateListWhere([args.status], args)
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
      where: `${generateTimeConstraint('date', args.initialDate, args.endDate)}`
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