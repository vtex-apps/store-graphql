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
    name: async (obj: BreadcrumbParams, args: any, ctx: Context) => {
      const {clients: {segment}} = ctx
      const { queryUnit, mapUnit, index, queryArray, categories, categoriesSearched, products } = obj
      let name = queryArray[index]
      if (mapUnit === 'c') {
        const queryPosition = categoriesSearched.findIndex(cat => cat === queryUnit)
        const category = findCategoryInTree(categories, categoriesSearched.slice(0, queryPosition + 1))
        if (category) {
          const nameIoMessage = await toCategoryIOMessage('name')(segment, category.name, category.id)
          name = nameIoMessage.content
        }
        // if cant find a category, we should try to see if its a product cluster
        const clusterName = findClusterNameFromId(products, queryUnit)
        name = clusterName || name
      }
      if (mapUnit === 'b') {
        const brand = await getBrandFromSlug(toLower(queryUnit), ctx) || {}
        name = brand.name || name
      }
      return name
    },
    href: async (obj: BreadcrumbParams) => {
      const { index, queryArray, mapArray } = obj
      const isLast = index === mapArray.length - 1
      return isLast ? null : '/' + queryArray.slice(0, index + 1).join('/') + '?map=' + mapArray.slice(0, index + 1)
    }
  }
}