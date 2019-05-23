import { CatalogCrossSellingTypes } from "./utils"

export const resolvers = {
  Recommendation: {
    buy: ({productId}: any, _: any, {dataSources: {catalog}}: Context) => catalog.crossSelling(productId, CatalogCrossSellingTypes.whoboughtalsobought),

    similars: ({productId}: any, _: any, {dataSources: {catalog}}: Context) => catalog.crossSelling(productId, CatalogCrossSellingTypes.similars),

    view: ({productId}: any, _: any, {dataSources: {catalog}}: Context) => catalog.crossSelling(productId, CatalogCrossSellingTypes.whosawalsosaw),
  }
}
