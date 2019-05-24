import { CatalogCrossSellingTypes } from "./utils"

export const resolvers = {
  Recommendation: {
    buy: ({productId}: Product, _: any, {dataSources: {catalog}}: Context) => catalog.crossSelling(productId, CatalogCrossSellingTypes.whoboughtalsobought),

    similars: ({productId}: Product, _: any, {dataSources: {catalog}}: Context) => catalog.crossSelling(productId, CatalogCrossSellingTypes.similars),

    view: ({productId}: Product, _: any, {dataSources: {catalog}}: Context) => catalog.crossSelling(productId, CatalogCrossSellingTypes.whosawalsosaw),
  }
}
