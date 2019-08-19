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
  length,
} from 'ramda'

import { Functions } from '@gocommerce/utils'
import { Slugify } from './slug'

import { queries as benefitsQueries } from '../benefits'
import { toBrandIOMessage, toProductIOMessage, toSpecificationIOMessage } from './../../utils/ioMessage'
import { buildCategoryMap, hashMD5 } from './utils'
import { getRoute } from './../../utils/routes'

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

const removeTrailingSlashes = (str: string) =>
  str.endsWith('/') ? str.slice(0, str.length - 1) : str

const removeStartingSlashes = (str: string) =>
  str.startsWith('/') ? str.slice(1) : str

const parseId = compose(
  Number,
  last,
  split('/'),
  removeTrailingSlashes
)

const getCategoryLevel = compose(
  length,
  split('/'),
  removeTrailingSlashes,
  removeStartingSlashes
)

const productCategoriesToCategoryTree = async (
  {
    categories,
    categoriesIds,
  }: { categories: string[]; categoriesIds: string[] },
  _: any,
  { clients: { catalog }, vtex: { account } }: Context
) => {
  if (!categories || !categoriesIds) {
    return []
  }
  const reversedIds = reverse(categoriesIds)
  if (!Functions.isGoCommerceAcc(account)) {
    return reversedIds.map(categoryId => catalog.category(parseId(categoryId)))
  }
  const level = Math.max(...reversedIds.map(getCategoryLevel))
  const categoriesTree = await catalog.categories(level)
  const categoryMap = buildCategoryMap(categoriesTree)
  const mappedCategories = reversedIds.map(id => categoryMap[parseId(id)]).filter(Boolean)

  return mappedCategories.length ? mappedCategories : null
}

export const resolvers = {
  Product: {
    canonicalRoute: async (product: any, _: any, {clients: {apps}}: Context ) =>
      getRoute(apps, 'product', 'canonical', {
        ...product,
        slug: Slugify(product.productName),
      }),

    internalRoute: async (product: any, _: any, {clients: {apps}}: Context ) =>
      getRoute(apps, 'product', 'internal', {
        ...product,
        slug: Slugify(product.productName),
        id: product.productId,
      }),

    benefits: ({ productId }: any, _: any, ctx: Context) =>
      benefitsQueries.benefits(_, { id: productId }, ctx),

    categoryTree: productCategoriesToCategoryTree,

    productName: (
      { productName, productId }: any,
      _: any,
      { clients: { segment } }: Context
    ) => toProductIOMessage('name')(segment, productName, productId),

    description: (
      { description, productId }: any,
      _: any,
      { clients: { segment } }: Context
    ) => toProductIOMessage('description')(segment, description, productId),

    brand: (
      { brand, brandId }: any,
      _: any,
      { clients: { segment } }: Context
    ) => toBrandIOMessage('name')(segment, brand, brandId),

    metaTagDescription: (
      { metaTagDescription, productId }: any,
      _: any,
      { clients: { segment } }: Context
    ) => toProductIOMessage('metaTagDescription')(segment, metaTagDescription, productId),

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

    titleTag: (
      { productTitle, productId }: any,
      _: any,
      { clients: { segment } }: Context
    ) => toProductIOMessage('titleTag')(segment, productTitle, productId),

    specificationGroups: (product: any, _: any, { clients: { segment } }: Context) => {
      const allSpecificationsGroups = propOr(
        [],
        'allSpecificationsGroups',
        product
      ).concat(['allSpecifications'])
      const specificationGroups = allSpecificationsGroups.map(
        (groupName: string) => ({
          name: toSpecificationIOMessage('groupName')(segment, groupName, hashMD5(groupName)),
          specifications: (product[groupName] || []).map(
            (name: string) => ({
              name: toSpecificationIOMessage('specificationName')(segment, name, hashMD5(name)),
              values: (product[name] || []).map(
                (value: string) => toSpecificationIOMessage('specificationValue')(segment, value, hashMD5(value))
              )
            })
          )
        })
      )
      return specificationGroups || []
    },

    items: (product: any, _: any, { clients: { segment } }: Context) => {
      const { allSpecifications, items, productId, productName, description: productDescription, brand: brandName, brandId } = product
      let productSpecifications = new Array() as [ProductSpecification]

      (allSpecifications || []).forEach(
        (specification: string) => {
          let fieldValues = new Array() as [Promise<TranslatableMessage>]
          (product[specification] || []).forEach(
            (value: string) => {
              fieldValues.push(toSpecificationIOMessage('fieldValue')(segment, value, hashMD5(value)))
            }
          )

          productSpecifications.push({
            fieldName: toSpecificationIOMessage('fieldName')(segment, specification, hashMD5(specification)),
            fieldValues
          })
        }
      )

      if (items && items.length > 0) {
        items.forEach(
          (item: any) => {
            item.productSpecifications = productSpecifications
            item.productName = toProductIOMessage('name')(segment, productName, productId)
            item.productDescription = toProductIOMessage('description')(segment, productDescription, productId)
            item.brandName = toBrandIOMessage('name')(segment, brandName, brandId)
          }
        )
      }
      return items
    }
  },

  OnlyProduct: {
    categoryTree: productCategoriesToCategoryTree,
  },
}
