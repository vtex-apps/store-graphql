import {
  compose,
  last,
  map,
  omit,
  propOr,
  reject,
  reverse,
  split,
  toPairs,
} from 'ramda'
import { map as bluebirdMap } from 'bluebird'

import { queries as benefitsQueries } from '../benefits'
import { toProductIOMessage } from './../../utils/ioMessage'
import { Catalog } from '../../clients/catalog'

const objToNameValue = (
  keyName: string,
  valueName: string,
  record: Record<string, any>
) =>
  compose(
    reject(value => typeof value === 'boolean' && value === false),
    map<[string, any], any>(
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

type CategoryMap = Record<string, Category>

/**
 * We are doing this because the `get category` API is not returning the values
 * for slug and href. So we get the whole category tree and get that info from
 * there instead until the Catalog team fixes this issue with the category API.
 */
async function getCategoryInfo(catalog: Catalog, id: string, levels: number) {
  const categories = (await catalog.categories(levels)) as Category[]

  const mapCategories = categories.reduce(appendToMap, {}) as CategoryMap

  const category = mapCategories[id] || { url: '' }

  return category
}

/**
 * That's a recursive function to fill an object like { [categoryId]: Category }
 * It will go down the category.children appending its children and so on.
 */
function appendToMap(mapCategories: CategoryMap, category: Category) {
  mapCategories[category.id] = category

  mapCategories = category.children.reduce(appendToMap, mapCategories)

  return mapCategories
}

const removeTrailingSlashes = (str: string) =>
  str.endsWith('/') ? str.slice(0, str.length - 1) : str

const productCategoriesToCategoryTree = async (
  {
    categories,
    categoriesIds,
  }: { categories: string[]; categoriesIds: string[] },
  _: any,
  { clients: { catalog } }: Context
) => {
  if (!categories || !categoriesIds) {
    return []
  }
  const levels = categoriesIds.length
  const categoryInfos = await bluebirdMap(categoriesIds, async categoryId => {
    const id = last(split('/', removeTrailingSlashes(categoryId)))
    if (!id) {
      return null
    }
    const category = await getCategoryInfo(catalog, id, levels).catch(
      () => null
    )
    return category
  })
  return reverse(categoryInfos)
}

export const resolvers = {
  Product: {
    benefits: ({ productId }: any, _: any, ctx: Context) =>
      benefitsQueries.benefits(_, { id: productId }, ctx),

    categoryTree: productCategoriesToCategoryTree,

    description: (
      { description, productId }: any,
      _: any,
      { clients: { segment } }: Context
    ) => toProductIOMessage('description')(segment, description, productId),

    productName: (
      { productName, productId }: any,
      _: any,
      { clients: { segment } }: Context
    ) => toProductIOMessage('name')(segment, productName, productId),

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

    titleTag: ({ productTitle }: any) => productTitle,

    specificationGroups: (product: any) => {
      const allSpecificationsGroups = propOr(
        [],
        'allSpecificationsGroups',
        product
      ).concat(['allSpecifications'])
      const specificationGroups = allSpecificationsGroups.map(
        (groupName: string) => ({
          name: groupName,
          specifications: map(
            (name: string) => ({ name, values: product[name] }),
            product[groupName] || []
          ),
        })
      )
      return specificationGroups || []
    },
  },
  OnlyProduct: {
    categoryTree: productCategoriesToCategoryTree,
  },
}
