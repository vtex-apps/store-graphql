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

import { queries as benefitsQueries } from '../benefits'
import { localeFromDefaultSalesChannel } from './../../utils/ioMessage'
import { buildCategoryMap } from './utils'

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
  Offer: {
    teasers: propOr([], 'Teasers'),
    discountHighlights: propOr([], 'DiscountHighLight'),
    giftSkuIds: propOr([], 'GiftSkuIds')
  },
  Product: {
    benefits: ({ productId }: any, _: any, ctx: Context) =>
      benefitsQueries.benefits(_, { id: productId }, ctx),

    categoryTree: productCategoriesToCategoryTree,

    description: async (
      { description, vrn }: any,
      _: any,
      { clients: { segment } }: Context
    ) =>
    ({
      field: 'description',
      from: await localeFromDefaultSalesChannel(segment),
      content: description,
      vrn: vrn
    }),

    productName: async (
      { productName, vrn }: any,
      _: any,
      { clients: { segment } }: Context
    ) =>({
        field: 'name',
        from: await localeFromDefaultSalesChannel(segment),
        content: productName,
        vrn: vrn
      }),

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
