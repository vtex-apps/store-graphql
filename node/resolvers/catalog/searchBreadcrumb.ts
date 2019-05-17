import { toLower } from 'ramda'
import { findCategoryInTree, getBrandFromSlug } from "./utils"
import { toCategoryIOMessage } from "../../utils/ioMessage"

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

export const resolvers = {
  SearchBreadcrumb: {
    name: async (obj: BreadcrumbParams, _: any, ctx: Context) => {
      const {clients: {segment}} = ctx
      const { queryUnit, mapUnit, index, queryArray, categories, categoriesSearched, products } = obj
      const defaultName = queryArray[index]
      if (mapUnit === 'c') {
        const queryPosition = categoriesSearched.findIndex(cat => cat === queryUnit)
        const category = findCategoryInTree(categories, categoriesSearched.slice(0, queryPosition + 1))
        if (category) {
          const nameIoMessage = await toCategoryIOMessage('name')(segment, category.name, category.id)
          return nameIoMessage.content
        }
        // if cant find a category, we should try to see if its a product cluster
        const clusterName = findClusterNameFromId(products, queryUnit)
        return clusterName || defaultName
      }
      if (mapUnit === 'b') {
        const brand = await getBrandFromSlug(toLower(queryUnit), ctx) || {}
        return brand.name || defaultName
      }
      return defaultName
    },
    href: async (obj: BreadcrumbParams) => {
      const { index, queryArray, mapArray } = obj
      return '/' + queryArray.slice(0, index + 1).join('/') + '?map=' + mapArray.slice(0, index + 1)
    }
  }
}