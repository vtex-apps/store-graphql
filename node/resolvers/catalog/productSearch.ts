import { path, zip } from 'ramda'
import { IOResponse } from '@vtex/api';

interface ProductSearchParent {
  productsRaw: IOResponse<Product[]>
  translatedArgs: SearchArgs
  searchMetaData: {
    titleTag: string | null
    metaTagDescription: string | null
  }
}

export const resolvers = {
  ProductSearch: {
    titleTag: path(['searchMetaData', 'titleTag']),
    metaTagDescription: path(['searchMetaData', 'metaTagDescription']),
    recordsFiltered: ({ productsRaw }: ProductSearchParent) => {
      const { headers: {resources}} = productsRaw
      const quantity = resources.split('/')[1]
      return parseInt(quantity, 10)
    },
    products: path(['productsRaw', 'data']),
    breadcrumb: async ({ translatedArgs, productsRaw: {data: products} }: ProductSearchParent, _: any, ctx: Context) => {
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
