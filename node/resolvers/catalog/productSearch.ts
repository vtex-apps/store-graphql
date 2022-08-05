import { path, zip } from 'ramda'
import { IOResponse } from '@vtex/api'
import { Functions } from '@gocommerce/utils'

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
      const {
        headers: { resources },
      } = productsRaw

      const [, quantity] = resources.split('/')

      return parseInt(quantity, 10)
    },
    products: path(['productsRaw', 'data']),
    breadcrumb: async (
      { translatedArgs, productsRaw: { data: products } }: ProductSearchParent,
      _: any,
      { vtex: { account }, clients: { catalog } }: Context
    ) => {
      const query = translatedArgs.query ?? ''
      const map = translatedArgs.map ?? ''
      const queryAndMap = zip(
        query.toLowerCase().split('/').map(decodeURIComponent),
        map.split(',')
      )

      const categoriesSearched = queryAndMap
        .filter(([__, m]) => m === 'c')
        .map(([q]) => q)

      const categoriesCount = map.split(',').filter((m) => m === 'c').length
      const categories =
        !!categoriesCount && Functions.isGoCommerceAcc(account)
          ? await catalog.categories(categoriesCount)
          : []

      return queryAndMap.map(
        ([queryUnit, mapUnit]: [string, string], index: number) => ({
          queryUnit,
          mapUnit,
          index,
          queryArray: query.split('/'),
          mapArray: map.split(','),
          categories,
          categoriesSearched,
          products,
        })
      )
    },
  },
}
