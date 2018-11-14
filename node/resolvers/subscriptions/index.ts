import { generateBetweenConstraint, generateOrConstraint } from '../masterDataQueryBuilders'

const SUBSCRIPTION_ORDERS_SCHEMA = "subscription_orders-v1"
const SUBSCRIPTION_SCHEMA = 'bi-v1'

const fieldResolver = (field) => field.replace(/(_[a-z])/g, char => char.toUpperCase()).replace(/(_)/g, '')

const generateListWhere = (statusList, args) => {
  if (statusList.length == 0)
    return `(${generateBetweenConstraint('date', args.initialDate, args.endDate)})`
  else
    return `(${generateOrConstraint(statusList, 'status')}) AND (${generateBetweenConstraint('date', args.initialDate, args.endDate)})`
}

export const queries = {
  subscriptionsCountByStatus: async (_, args, { dataSources: { subscription } }) => {
    const options = {
      field: 'status',
      interval: 'day',
      schema: SUBSCRIPTION_SCHEMA,
      type: 'count',
      where: generateBetweenConstraint('createdAt', args.initialDate, args.endDate),
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
      where: `${generateBetweenConstraint('date', args.initialDate, args.endDate)}`
    }

    return subscription.getSubscriptionOrdersAggregations(options).then((data) => {
      return (data && data.result ? data.result : []).reduce((acc, item) => ({
        ...acc,
        [fieldResolver(item.key)]: item.value,
      }), {
          triggered: 0,
          inProcess: 0,
          failure: 0,
          success: 0,
          expired: 0,
          orderError: 0,
          paymentError: 0,
          skiped: 0,
          successWithNoOrder: 0,
          successWithPartialOrder: 0
        })
    })
  }
}