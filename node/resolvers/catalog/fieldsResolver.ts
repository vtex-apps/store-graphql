import { IOContext } from 'colossus'
import { compose, juxt, last, map, omit, prop, split, toPairs } from 'ramda'
import * as slugify from 'slugify'

import { resolveBuy, resolveView } from './recommendationsResolver'

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

const objToNameValue = (
  keyName: string,
  valueName: string,
  record: Record<string, any>
) =>
  map(
    ([key, value]) => ({ [keyName]: key, [valueName]: value }),
    toPairs(record)
  )

const resolvers = {
  clusterHighlights: product => {
    const { clusterHighlights = {} } = product
    return objToNameValue('id', 'name', clusterHighlights)
  },

  productClusters: product => {
    const { productClusters = {} } = product
    return objToNameValue('id', 'name', productClusters)
  },

  propertyGroups: product => {
    const { allSpecifications = [] } = product
    const notPG = knownNotPG.concat(allSpecifications)
    return objToNameValue('name', 'values', omit(notPG, product))
  },

  properties: product => {
    const { allSpecifications = [] } = product
    return map((name: string) => ({ name, values: product[name] }), allSpecifications)
  },

  variations: sku => {
    const { variations = [] } = sku
    return map((name: string) => ({ name, values: sku[name] }), variations)
  },

  attachments: sku => {
    return map(
      attachment => ({
        ...attachment,
        domainValues: JSON.parse(attachment.domainValues),
      }),
      sku.attachments || []
    )
  },

  items: product => {
    return map(sku => {
      const resolveFields = juxt([resolvers.variations, resolvers.attachments])
      const [variations, attachments] = resolveFields(sku)
      return { ...sku, attachments, variations }
    }, product.items || [])
  },

  specificationFilters: facets => {
    const { SpecificationFilters = {} } = facets
    return objToNameValue('name', 'facets', SpecificationFilters)
  },

  jsonSpecifications: facets => {
    const { Specifications = [] } = facets
    const specificationsMap = Specifications.reduce((acc, key) => {
      acc[key] = facets[key]
      return acc
    }, {})
    return JSON.stringify(specificationsMap)
  },
}

export const resolveLocalProductFields = product => {
  const resolveFields = juxt([
    resolvers.clusterHighlights,
    resolvers.propertyGroups,
    resolvers.properties,
    resolvers.items,
    resolvers.productClusters,
    resolvers.jsonSpecifications,
  ])
  const [
    clusterHighlights,
    propertyGroups,
    properties,
    items,
    productClusters,
    jsonSpecifications,
  ] = resolveFields(product)
  return {
    ...product,
    cacheId: product.linkText,
    clusterHighlights,
    items,
    properties,
    propertyGroups,
    productClusters,
    jsonSpecifications,
  }
}

export const resolveProductFields = async (
  ioContext: IOContext,
  product: any,
  fields: any,
  distinctRecomendations: boolean
) => {
  const resolvedProduct = resolveLocalProductFields(product)
  if (!fields.recommendations) {
    return resolvedProduct
  }

  const [view, buy] = await Promise.all([
    resolveView(ioContext, product, distinctRecomendations),
    resolveBuy(ioContext, product, distinctRecomendations),
  ])
  return { ...resolvedProduct, recommendations: { buy, view } }
}

export const resolveFacetFields = facets => {
  const SpecificationFilters = resolvers.specificationFilters(facets)
  return { ...facets, SpecificationFilters }
}

export const resolveCategoryFields = category => ({
  href: category.url,
  slug: category.url
    ? compose(
      last,
      split('/'),
      prop('url')
    )(category)
    : null,
  children: category.children
    ? map(resolveCategoryFields, category.children)
    : [],
  name: category.name,
  id: category.id,
  cacheId: category.id,
  hasChildren: category.hasChildren,
})

export const resolveBrandFields = brand => {
  const slu = slugify(brand.name, { lower: true })
  return ({
    active: brand.isActive,
    cacheId: slu,
    id: brand.id,
    name: brand.name,
    slug: slu
  })
}
