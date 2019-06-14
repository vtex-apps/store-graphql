import { compose, last, map, omit, propOr, reject, reverse, split, toPairs, zip } from 'ramda'

import { queries as benefitsQueries } from '../benefits'
import { toProductIOMessage } from './../../utils/ioMessage'

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

const removeTrailingSlashes = (str: string) => str.endsWith('/')
  ? str.slice(0, str.length-1)
  : str

const productCategoriesToCategoryTree = (
  {categories, categoriesIds}: {categories: string[], categoriesIds: string[]}
) => {
  /** This is a hotfix for a "cannot get length of undefined" bug.
  * The actual cause should be properly investigated */
  try {
    return compose<[string, string][], {id: number, name: string}[], {id: number, name: string}[]>(
      reverse,
      map(([idTree, categoryTree]) => ({
        id: Number(last(split('/', removeTrailingSlashes(idTree)))),
        name: String(last(split('/', removeTrailingSlashes(categoryTree)))),
      }))
    )(zip(categoriesIds, categories))
  } catch (error) {
    return []
  }
}

export const resolvers = {
  Product: {
    benefits: ({ productId }: any, _: any, ctx: Context) =>
      benefitsQueries.benefits(_, { id: productId }, ctx),

    categoryTree: productCategoriesToCategoryTree,

    description: (
      { description, productId }: any,
      _: any,
      {clients: {segment}}: Context
    ) =>
      toProductIOMessage('description')(segment, description, productId),

    productName: (
      { productName, productId }: any,
      _: any,
      {clients: {segment}}: Context
    ) =>
      toProductIOMessage('name')(segment, productName, productId),

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
  }
}
