export const resolvers = {
  Recommendation: {
    buy: ({productId}: any, _: any, {dataSources: {catalog}}: Context) => catalog.crossSelling(productId, 'whoboughtalsobought'),

    similars: ({productId}: any, _: any, {dataSources: {catalog}}: Context) => catalog.crossSelling(productId, 'similars'),

    view: ({productId}: any, _: any, {dataSources: {catalog}}: Context) => catalog.crossSelling(productId, 'whosawalsosaw'),
  }
}
