import { compose, equals, map, omit, reject, toPairs } from 'ramda'
import { queries as benefitsQueries } from '../benefits'

const objToNameValue = (keyName: string, valueName: string, record: Record<string, any>) => compose(
  reject(equals(false)),
  map(([key, value]) => typeof value === 'string' && ({ [keyName]: key, [valueName]: value })),
  toPairs
)(record)

const knownNotPG = [
  'allSpecifications',
  'brand',
  'categories',
  'categoriesIds',
  'categoryId',
  'clusterHighlights',
  'productClusters',
  'description',
  'items',
  'productId',
  'productName',
  'link',
  'linkText',
  'productReference',
]

export const resolvers = {
  Product: {
    benefits: async ({productId}, _, ctx, __) => benefitsQueries.benefits(_, {id: productId}, ctx),

    cacheId: ({linkText}) => linkText,

    clusterHighlights: (clusterHighlights = {}) => objToNameValue('id', 'name', clusterHighlights),

    jsonSpecifications: facets => {
      const { Specifications = [] } = facets
      const specificationsMap = Specifications.reduce((acc, key) => {
        acc[key] = facets[key]
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

    titleTag: ({productTitle}) => productTitle
  }
}
