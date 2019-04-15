import { map as mapP } from 'bluebird'
import { GraphQLResolveInfo } from 'graphql'
import { compose, map, omit, propOr, reject, toPairs } from 'ramda'

import { queries as benefitsQueries } from '../benefits'
import { toIOMessage } from './../../utils/ioMessage'

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

export const resolvers = {
  Product: {
    benefits: ({ productId }: any, _: any, ctx: Context) =>
      benefitsQueries.benefits(_, { id: productId }, ctx),

    categories: ({ categories }: {categories: string[]}, _: any, ctx: Context) => mapP(
      categories,
      category => toIOMessage(ctx, category, `category-${category}`)
    ),

    description: ({ description, productId }: any, _: any, ctx: Context, info: GraphQLResolveInfo) => toIOMessage(ctx, description, `${info.parentType}-${info.fieldName}-${productId}`),

    productName: ({ productName, productId }: any, _: any, ctx: Context, info: GraphQLResolveInfo) => toIOMessage(ctx, productName, `${info.parentType}-${info.fieldName}-${productId}`),

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
      const allSpecificationsGroups = propOr([], 'allSpecificationsGroups', product).concat([
        'allSpecifications',
      ])
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
}
