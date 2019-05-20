import { toLower } from 'ramda'
import { findCategoryInTree, getBrandFromSlug } from "./utils"
import { toCategoryIOMessage, toClusterIOMessage } from "../../utils/ioMessage"

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
  const productWithCluster = products.find(({ productClusters }) => !!productClusters[clusterId])
  return productWithCluster && productWithCluster.productClusters[clusterId]
}

const sliceAndJoin = (array: string[], max: number, joinChar: string) => array.slice(0, max).join(joinChar)

export const resolvers = {
  SearchBreadcrumb: {
    name: async (obj: BreadcrumbParams, _: any, ctx: Context) => {
      const {clients: {segment}} = ctx
      const { queryUnit, mapUnit, index, queryArray, categories, categoriesSearched, products } = obj
      const defaultName = queryArray[index]
      if (mapUnit === 'productClusterIds') {
        const clusterName = findClusterNameFromId(products, queryUnit)
        if (clusterName) {
          return toClusterIOMessage(segment, clusterName, queryUnit)
        }
      }
      if (mapUnit === 'c') {
        const queryPosition = categoriesSearched.findIndex(cat => cat === queryUnit)
        const category = findCategoryInTree(categories, categoriesSearched.slice(0, queryPosition + 1))
        if (category) {
          return toCategoryIOMessage('name')(segment, category.name, category.id)
        }
        // if cant find a category, we should try to see if its a product cluster
        const clusterName = findClusterNameFromId(products, queryUnit)
        if (clusterName) {
          return toClusterIOMessage(segment, clusterName, queryUnit)
        }
      }
      if (mapUnit === 'b') {
        const brand = await getBrandFromSlug(toLower(queryUnit), ctx)
        return brand ? brand.name : defaultName
      }
      return defaultName
    },
    href: ({ index, queryArray, mapArray }: BreadcrumbParams) =>
      `/${sliceAndJoin(queryArray, index+1, '/')}?map=${sliceAndJoin(mapArray, index+1, ',')}`
  }
}