import { compose, map, omit, reject, toPairs } from 'ramda'
import { queries as benefitsQueries } from '../benefits'
import { toIOMessage } from './../../utils/ioMessage'

const objToNameValue = (keyName: string, valueName: string, record: Record<string, any>) => compose(
  reject(value => typeof value === 'boolean' && value === false),
  map(([key, value]) => typeof value === 'string' && ({ [keyName]: key, [valueName]: value })),
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
    benefits: ({productId}, _, ctx) => benefitsQueries.benefits(_, {id: productId}, ctx),

    categories: ({categories}, _, ctx) => Promise.all(map((category: string) => toIOMessage(ctx, category), categories)),

    description: ({description}, _, ctx) => toIOMessage(ctx, description),

    productName: ({productName}, _, ctx) => toIOMessage(ctx, productName),

    cacheId: ({linkText}) => linkText,

    clusterHighlights: ({clusterHighlights = {}}) => objToNameValue('id', 'name', clusterHighlights),

    jsonSpecifications: product => {
      const { Specifications = [] } = product
      const specificationsMap = Specifications.reduce((acc, key) => {
        acc[key] = product[key]
        return acc
      }, {})
      return JSON.stringify(specificationsMap)
    },

    productClusters: ({productClusters = {}}) => objToNameValue('id', 'name', productClusters),

    properties: product => map((name: string) => ({ name, values: product[name] }), product.allSpecifications || []),

    propertyGroups: product => {
      const { allSpecifications = [] } = product
      const notPG = knownNotPG.concat(allSpecifications)
      return objToNameValue('name', 'values', omit(notPG, product))
    },

    recommendations: product => product,

    titleTag: ({productTitle}) => productTitle,
  },
}
