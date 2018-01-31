import {juxt, map, omit} from 'ramda'
import {objToNameValue} from './objToNameValue'
import {resolveBuy, resolveView} from './recommendationsResolver'

const knownNotPG = [
  'allSpecifications',
  'brand',
  'categories',
  'categoriesIds',
  'categoryId',
  'clusterHighlights',
  'description',
  'items',
  'productId',
  'productName',
  'link',
  'linkText',
  'productReference',
]

export default {
  Product: {
    clusterHighlights: (product) => {
      const {clusterHighlights={}} = product
      return objToNameValue('id', 'name', clusterHighlights)
    },

    propertyGroups: (product) => {
      const {allSpecifications=[]} = product
      const notPG = knownNotPG.concat(allSpecifications)
      return objToNameValue('name', 'properties', omit(notPG, product))
    },

    properties: (product) => {
      const {allSpecifications=[]} = product
      return map(name => ({name, values: product[name]}), allSpecifications)
    },

    recommendations: async (product, args, {vtex: ioContext}) => {
      const [view, buy] = await Promise.all([
        resolveView(ioContext, product),
        resolveBuy(ioContext, product)
      ])
      return {buy, view}
    }
  },

  SKU: {
    variations: (sku) => {
      const {variations=[]} = sku
      return map(name => ({name, values: sku[name]}), variations)
    },
  },

  Attachment: {
    domainValues: ({domainValues}) => JSON.parse(domainValues),
  }
}
