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
import { toProductIOMessage } from './../../utils/ioMessage'
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
    discountHighlights: propOr([], 'DiscountHighLight')
  },
  Product: {

  },
  OnlyProduct: {
    categoryTree: productCategoriesToCategoryTree,
  },
}
