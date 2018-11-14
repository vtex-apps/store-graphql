import { prop } from 'ramda'

export const resolvers = {
  SubscriptionsOrdersStatusCount: {
    inProcess: prop('in_process'),
    orderError: prop('order_error'),
    paymentError: prop('payment_error'),
    successWithNoOrder: prop('success_with_no_order'),
    successWithPartialOrder: prop('success_with_partial_order')
  }
}