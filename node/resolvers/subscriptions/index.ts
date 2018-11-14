import { generateBetweenConstraint, generateOrConstraint } from '../masterDataQueryBuilders'
import { resolvers as subscriptionsOrdersStatusCountResolvers } from './subscription'

const SUBSCRIPTION_ORDERS_SCHEMA = 'subscription_orders-v1'
const SUBSCRIPTION_SCHEMA = 'bi-v1'

const generateListWhere = (statusList, args) => {
  if (statusList.length === 0) {
    return `${generateBetweenConstraint('date', args.initialDate, args.endDate)} AND (orderGroup is not null)`
  }
  else {
    return `${generateOrConstraint(statusList, 'status')} AND ${generateBetweenConstraint('date', args.initialDate, args.endDate)} AND (orderGroup is not null)`
  }
}

export const fieldResolvers = {
  ...subscriptionsOrdersStatusCountResolvers,
}

export const queries = {
  subscriptionsCountByStatus: async (_, args, { dataSources: { subscriptions } }) => {
    const options = {
      field: 'status',
      interval: 'day',
      schema: SUBSCRIPTION_SCHEMA,
      type: 'count',
      where: generateBetweenConstraint('createdAt', args.initialDate, args.endDate),
    }

    return subscriptions.subscriptionsAggregations(options).then((data) => {
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

  listSubscriptionsOrdersByStatus: async (_, args, { dataSources: { subscriptions } }) => {
    let where
    switch (args.status) {
      case 'SUCCESSFUL':
        where = generateListWhere(['SUCCESS', 'SUCCESS_WITH_NO_ORDER', 'SUCCESS_WITH_PARTIAL_ORDER'], args)
        break
      case 'ERROR':
        where = generateListWhere(['FAILURE', 'ORDER_ERROR', 'PAYMENT_ERROR'], args)
        break
      case 'ALL':
        where = generateListWhere([], args)
        break
      default:
        where = generateListWhere([args.status], args)
        break
    }

    const options = {
      fields: '_all',
      schema: SUBSCRIPTION_ORDERS_SCHEMA,
      where
    }

    return subscriptions.getSubscriptionsOrders(options)
  },

  subscriptionsOrdersCountByStatus: async (_, args, { dataSources: { subscriptions } }) => {
    const options = {
      field: 'status',
      interval: 'day',
      schema: SUBSCRIPTION_ORDERS_SCHEMA,
      type: 'count',
      where: `${generateBetweenConstraint('date', args.initialDate, args.endDate)} AND (orderGroup is not null)`
    }

    return subscriptions.getSubscriptionsOrdersAggregations(options).then((data) => {
      return (data && data.result ? data.result : []).reduce((acc, item) => ({
        ...acc,
        [item.key]: item.value,
      }), {
          expired: 0,
          failure: 0,
          'in_process': 0,
          'order_error': 0,
          'payment_error': 0,
          skiped: 0,
          success: 0,
          'success_with_no_order': 0,
          'success_with_partial_order': 0,
          triggered: 0
        })
    })
  }
}

export const mutations = {
  subscriptionsOrderRetry: async (_, args, { dataSources: { subscriptionsGroup } }) => {
    await subscriptionsGroup.retry(args)

    return true
  }
}