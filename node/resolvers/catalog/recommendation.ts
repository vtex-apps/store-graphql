export const resolvers = {
  Recommendation: {
    buy: ({productId}, _, {dataSources: {catalog}}) => catalog.crossSelling(productId, 'whoboughtalsobought'),

    similars: ({productId}, _, {dataSources: {catalog}}) => catalog.crossSelling(productId, 'similars'),

    view: ({productId}, _, {dataSources: {catalog}}) => catalog.crossSelling(productId, 'whosawalsosaw'),
  }
}
