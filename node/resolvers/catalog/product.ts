import { compose, last, map, omit, reject, split, toPairs } from 'ramda'

import { queries as benefitsQueries } from '../benefits'
import { buildCategoryMap } from './utils'

type MaybeRecord = false | Record<string, any>
const objToNameValue = (
  keyName: string,
  valueName: string,
  record: Record<string, any>
) =>
  compose<
    Record<string, any>,
    Array<[string, any]>,
    MaybeRecord[],
    MaybeRecord
  >(
    reject<MaybeRecord>(
      (value) => typeof value === 'boolean' && value === false
    ),
    map<[string, any], MaybeRecord>(
      ([key, value]) =>
        typeof value === 'string' && { [keyName]: key, [valueName]: value }
    ),
    toPairs
  )(record)

const knownNotPG = [
  'allSpecifications',
  'brand',
  'categoriesIds',
  'categoryId',
  'clusterHighlights',
  'productClusters',
  'items',
  'productId',
  'link',
  'linkText',
  'productReference',
]

const removeTrailingSlashes = (str: string) =>
  str.endsWith('/') ? str.slice(0, str.length - 1) : str

const removeStartingSlashes = (str: string) =>
  str.startsWith('/') ? str.slice(1) : str

const getLastCategory = compose<string, string, string[], string>(
  last,
  split('/'),
  removeTrailingSlashes
)

const treeStringToArray = compose(
  split('/'),
  removeTrailingSlashes,
  removeStartingSlashes
)

const findMainTree = (categoriesIds: string[], prodCategoryId: string) => {
  const mainTree = categoriesIds.find(
    (treeIdString) => getLastCategory(treeIdString) === prodCategoryId
  )

  if (mainTree) {
    return treeStringToArray(mainTree)
  }

  // If we are here, did not find the specified main category ID in given strings. It is probably a bug.
  // We will return the biggest tree we find

  const trees = categoriesIds.map(treeStringToArray)

  return trees.reduce(
    (acc, currTree) => (currTree.length > acc.length ? currTree : acc),
    []
  )
}

const productCategoriesToCategoryTree = async (
  {
    categories,
    categoriesIds,
    categoryId: prodCategoryId,
  }: { categories: string[]; categoriesIds: string[]; categoryId: string },
  _: any,
  { clients: { catalog }, vtex: { platform } }: Context
) => {
  if (!categories || !categoriesIds) {
    return []
  }

  const mainTreeIds = findMainTree(categoriesIds, prodCategoryId)

  if (platform === 'vtex') {
    return mainTreeIds.map((categoryId) => catalog.category(Number(categoryId)))
  }

  const categoriesTree = await catalog.categories(mainTreeIds.length)
  const categoryMap = buildCategoryMap(categoriesTree)
  const mappedCategories = mainTreeIds
    .map((id) => categoryMap[id])
    .filter(Boolean)

  return mappedCategories.length ? mappedCategories : null
}

export const resolvers = {
  Product: {
    benefits: ({ productId }: any, _: any, ctx: Context) =>
      benefitsQueries.benefits(_, { id: productId }, ctx),

    categoryTree: productCategoriesToCategoryTree,

    cacheId: ({ linkText }: any) => linkText,

    clusterHighlights: ({ clusterHighlights = {} }) =>
      objToNameValue('id', 'name', clusterHighlights),

    jsonSpecifications: (product: any) => {
      const { Specifications = [] } = product
      const specificationsMap = Specifications.reduce((acc: any, key: any) => {
        acc[key] = product[key]

        return acc
      }, {})

      return JSON.stringify(specificationsMap)
    },

    productClusters: ({ productClusters = {} }) =>
      objToNameValue('id', 'name', productClusters),

    properties: (product: any) =>
      map(
        (name: string) => ({ name, values: product[name] }),
        product.allSpecifications || []
      ),

    propertyGroups: (product: any) => {
      const { allSpecifications = [] } = product
      const notPG = knownNotPG.concat(allSpecifications)

      return objToNameValue('name', 'values', omit(notPG, product))
    },

    recommendations: (product: any) => product,

    specificationGroups: (product: any) => {
      const productSpecificationGroups = (product?.allSpecificationsGroups ??
        []) as string[]

      const allSpecificationsGroups = productSpecificationGroups.concat([
        'allSpecifications',
      ])

      const specificationGroups = allSpecificationsGroups.map(
        (groupName: string) => ({
          name: groupName,
          specifications: (product[groupName] || []).map((name: string) => ({
            name,
            values: product[name] || [],
          })),
        })
      )

      return specificationGroups || []
    },

    items: (product: any) => {
      const {
        allSpecifications,
        items,
        productName,
        description: productDescription,
        brand: brandName,
      } = product

      const productSpecifications: ProductSpecification[] = []

      ;(allSpecifications || []).forEach((specification: string) => {
        const fieldValues: string[] = []

        ;(product[specification] || []).forEach((value: string) => {
          fieldValues.push(value)
        })

        productSpecifications.push({
          fieldName: specification,
          fieldValues,
        })
      })

      if (items && items.length > 0) {
        items.forEach((item: any) => {
          item.productSpecifications = productSpecifications
          item.productName = productName
          item.productDescription = productDescription
          item.brandName = brandName
        })
      }

      return items
    },
  },

  OnlyProduct: {
    categoryTree: productCategoriesToCategoryTree,
  },
}
