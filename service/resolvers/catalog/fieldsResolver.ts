import axios from 'axios'
import {IOContext} from 'colossus'
import {compose, evolve, juxt, map, omit, path, pick, prop, propOr, toPairs} from 'ramda'
import paths from './../paths'
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

const objToNameValue = (keyName: string, valueName: string, record: Record<string, any>) =>
  map(([key, value]) => ({[keyName]: key, [valueName]: value}), toPairs(record))

const resolvers = {
  clusterHighlights: (product) => {
    const {clusterHighlights={}} = product
    return objToNameValue('id', 'name', clusterHighlights)
  },

  propertyGroups: (product) => {
    const {allSpecifications=[]} = product
    const notPG = knownNotPG.concat(allSpecifications)
    return objToNameValue('name', 'values', omit(notPG, product))
  },

  properties: (product) => {
    const {allSpecifications=[]} = product
    return map(name => ({name, values: product[name]}), allSpecifications)
  },

  variations: (sku) => {
    const {variations=[]} = sku
    return map(name => ({name, values: sku[name]}), variations)
  },

  attachments: (sku) => {
    return map(attachment => ({
      ...attachment,
      domainValues: JSON.parse(attachment.domainValues)
    }), sku.attachments || [])
  },

  items: (product) => {
    return map(sku => {
      const resolveFields = juxt([resolvers.variations, resolvers.attachments])
      const [variations, attachments] = resolveFields(sku)
      return {...sku, attachments, variations}
    }, product.items || [])
  },

  specificationFilters: (facets) => {
    const {SpecificationFilters={}} = facets
    return objToNameValue('name', 'value', SpecificationFilters)
  },
}

export const resolveLocalProductFields = (product) => {
  const resolveFields = juxt([resolvers.clusterHighlights, resolvers.propertyGroups, resolvers.properties, resolvers.items])
  const [clusterHighlights, propertyGroups, properties, items] = resolveFields(product)
  return {...product, clusterHighlights, items, properties, propertyGroups}
}

export const resolveProductFields = async (ioContext: IOContext, product: any, fields: any) => {
  const resolvedProduct = resolveLocalProductFields(product)

  if (!fields.Product || !fields.Product.recommendations) {
    return resolvedProduct
  }

  const [view, buy] = await Promise.all([
    resolveView(ioContext.account, product),
    resolveBuy(ioContext.account, product)
  ])

  return {...resolvedProduct, recommendations: {buy, view}}
}

export const resolveFacetFields = (facets) => {
  const SpecificationFilters = resolvers.specificationFilters(facets)
  return {...facets, SpecificationFilters}
}
