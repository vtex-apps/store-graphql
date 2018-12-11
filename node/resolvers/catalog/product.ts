import { compose, map, omit, reject, toPairs } from 'ramda'

import { queries as benefitsQueries } from '../benefits'
import { Slugify as slugify } from './slug'

const objToNameValue = (keyName: string, valueName: string, record: Record<string, any>) => compose(
  reject(value => typeof value === 'boolean' && value === false),
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
    benefits: ({productId}, _, ctx) => benefitsQueries.benefits(_, {id: productId}, ctx),

    cacheId: ({linkText}) => linkText,

    categories: ({categories}) => Array.isArray(categories) && map(slugify, categories),

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

    titleTag: ({productTitle}) => productTitle
  }
}
