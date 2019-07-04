import { equals, toLower } from 'ramda'
import { toCategoryIOMessage, toClusterIOMessage } from '../../utils/ioMessage'
import { findCategoryInTree, getBrandFromSlug } from './utils'
import { Functions } from '@gocommerce/utils'

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

const findSellerFromSellerId = (products: Product[], sellerId: string) => {
  let sellerName = null
  for (const product of products) {
    const { items } = product
    for (const item of items) {
      const seller = item.sellers.find(sel => sel.sellerId === sellerId)
      if (seller) {
        sellerName = seller.sellerName
        break
      }
    }
    if (sellerName) {
      break
    }
  }
  return sellerName
}

const sliceAndJoin = (array: string[], max: number, joinChar: string) =>
  array.slice(0, max).join(joinChar)

const isCategoryMap = equals('c')
const isBrandMap = equals('b')
const isProductClusterMap = equals('productClusterIds')
const isSellerMap = equals('sellerIds')

const getCategoryInfo = (
  { categoriesSearched, queryUnit, categories }: BreadcrumbParams,
  isVtex: boolean,
  ctx: Context
) => {
  const queryPosition = categoriesSearched.findIndex(cat => cat === queryUnit)
  if (!isVtex) {
    return findCategoryInTree(
      categories,
      categoriesSearched.slice(0, queryPosition + 1)
    )
  }
  return ctx.clients.catalog
    .pageType(categoriesSearched.slice(0, queryPosition + 1).join('/'))
    .catch(() => null)
}

const getBrandInfo = async (
  { queryUnit }: BreadcrumbParams,
  isVtex: boolean,
  { clients: { catalog } }: Context
) => {
  if (!isVtex) {
    return getBrandFromSlug(toLower(queryUnit), catalog)
  }
  return catalog.pageType(queryUnit).catch(() => null)
}

export const resolvers = {
  SearchBreadcrumb: {
    name: async (obj: BreadcrumbParams, _: any, ctx: Context) => {
      const {
        clients: { segment },
        vtex: { account },
      } = ctx
      const { queryUnit, mapUnit, index, queryArray, products } = obj
      const defaultName = queryArray[index]
      const isVtex = !Functions.isGoCommerceAcc(account)
      if (isProductClusterMap(mapUnit)) {
        const clusterName = findClusterNameFromId(products, queryUnit)
        if (clusterName) {
          return toClusterIOMessage(segment, clusterName, queryUnit)
        }
      }
      if (isCategoryMap(mapUnit)) {
        const categoryData = await getCategoryInfo(obj, isVtex, ctx)
        if (categoryData) {
          return toCategoryIOMessage('name')(
            segment,
            categoryData.name,
            categoryData.id
          )
        }
      }
      if (isSellerMap(mapUnit)) {
        const sellerName = findSellerFromSellerId(products, queryUnit)
        if (sellerName) {
          return sellerName
        }
      }
      if (isBrandMap(mapUnit)) {
        const brandData = await getBrandInfo(obj, isVtex, ctx)
        return brandData ? brandData.name : defaultName
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
