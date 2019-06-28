import { equals } from 'ramda'
import { toCategoryIOMessage, toClusterIOMessage } from '../../utils/ioMessage'

interface BreadcrumbParams {
  queryUnit: string
  mapUnit: string
  index: number
  queryArray: string[]
  mapArray: string[]
  categories: Category[]
  categoriesSearched: string[]
  products: Product[]
}

const findClusterNameFromId = (products: Product[], clusterId: string) => {
  const productWithCluster = products.find(
    ({ productClusters }) => !!productClusters[clusterId]
  )
  return productWithCluster && productWithCluster.productClusters[clusterId]
}

const sliceAndJoin = (array: string[], max: number, joinChar: string) =>
  array.slice(0, max).join(joinChar)

const isCategoryMap = equals('c')
const isBrandMap = equals('b')
const isProductClusterMap = equals('productClusterIds')

export const resolvers = {
  SearchBreadcrumb: {
    name: async (obj: BreadcrumbParams, _: any, ctx: Context) => {
      const {
        clients: { segment, catalog },
      } = ctx
      const {
        queryUnit,
        mapUnit,
        index,
        queryArray,
        categoriesSearched,
        products,
      } = obj
      const defaultName = queryArray[index]
      if (isProductClusterMap(mapUnit)) {
        const clusterName = findClusterNameFromId(products, queryUnit)
        if (clusterName) {
          return toClusterIOMessage(segment, clusterName, queryUnit)
        }
      }
      if (isCategoryMap(mapUnit)) {
        const pagetype = await catalog
          .pageType(categoriesSearched.slice(0, index + 1).join('/'))
          .catch(() => null)
        if (pagetype) {
          return toCategoryIOMessage('name')(
            segment,
            pagetype.name,
            pagetype.id
          )
        }
        // if cant find a category, we should try to see if its a product cluster
        const clusterName = findClusterNameFromId(products, queryUnit)
        if (clusterName) {
          return toClusterIOMessage(segment, clusterName, queryUnit)
        }
      }
      if (isBrandMap(mapUnit)) {
        const pagetype = await catalog.pageType(queryUnit).catch(() => null)
        return pagetype ? pagetype.name : defaultName
      }
      return defaultName && decodeURI(defaultName)
    },
    href: ({
      index,
      queryArray,
      mapArray,
      mapUnit,
      queryUnit,
    }: BreadcrumbParams) => {
      if (index === 0 && isCategoryMap(mapUnit)) {
        return `/${queryUnit}/d`
      }
      if (index === 0 && isBrandMap(mapUnit)) {
        return `/${queryUnit}/b`
      }
      if (mapArray.every(isCategoryMap)) {
        return `/${sliceAndJoin(queryArray, index + 1, '/')}`
      }
      return `/${sliceAndJoin(queryArray, index + 1, '/')}?map=${sliceAndJoin(
        mapArray,
        index + 1,
        ','
      )}`
    },
  },
}
