export const queries = {
  lastUserOrder: (_, __, {dataSources: {oms}}) => oms.lastUserOrder()
}
