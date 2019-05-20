import { path, zip } from 'ramda'
export const resolvers = {
  ProductSearch: {
    titleTag: path(['searchMetaData', 'titleTag']),
    metaTagDescription: path(['searchMetaData', 'metaTagDescription']),
    recordsFiltered: ({ translatedArgs }: { translatedArgs: ProductsArgs }, _: any, {dataSources: { catalog }}: Context) =>
      catalog.productsQuantity(translatedArgs),

    breadcrumb: async ({ translatedArgs, products }: { translatedArgs: ProductsArgs, products: Product[] }, _: any, ctx: Context) => {
      const {dataSources: { catalog }} = ctx
      const queryAndMap = zip(
        translatedArgs.query
          .toLowerCase()
          .split('/')
          .map(decodeURIComponent),
        translatedArgs.map.split(',')
      )
      const categoriesCount = translatedArgs.map.split(',').filter(m => m === 'c').length
      const categories = categoriesCount ? (await catalog.categories(categoriesCount)) : []
      const categoriesSearched = queryAndMap.filter(([_, m]) => m === 'c').map(([q]) => q)
      return queryAndMap.map(([queryUnit, mapUnit]: [string, string], index: number) => ({
        queryUnit,
        mapUnit,
        index,
        queryArray: translatedArgs.query.split('/'),
        mapArray: translatedArgs.map.split(','),
        categories,
        categoriesSearched,
        products,
      }))
    }
  }
}
