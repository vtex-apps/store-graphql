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
  Product: {
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

    descriptionShort: (
      { descriptionShort, productId }: any,
      _: any,
      { clients: { segment } }: Context
    ) => toProductIOMessage('descriptionShort')(segment, descriptionShort, productId),

    keywords: (
      { keywords, productId }: any,
      _: any,
      { clients: { segment } }: Context
    ) => toProductIOMessage('keywords')(segment, keywords, productId),

    title: (
      { title, productId }: any,
      _: any,
      { clients: { segment } }: Context
    ) => toProductIOMessage('title')(segment, title, productId),

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

    items: (product: any, _: any, { clients: { segment } }: Context) => {
      const {allSpecifications, items, productId, productName, description: productDescription} = product
      let productSpecifications = new Array() as [productSpecification]

      (allSpecifications || []).forEach(
        (specification: string) => {
          let productSpecification: productSpecification = {
            fieldName: toProductIOMessage('fieldName')(segment, specification, productId),
            fieldValues: new Array() as [Promise<{ content: string; from: string; id: string; }>] 
          };
          
          (product[specification] || []).forEach(
            (value: string) => {
              productSpecification.fieldValues.push(toProductIOMessage('fieldValue')(segment, value, productId))
            }
          )

          productSpecifications.push(productSpecification)
        }
      )
      
      if(items && items.length > 0) {
        items.forEach(
          (item: any) => {
            item.productSpecifications = productSpecifications
            item.productName = toProductIOMessage('productName')(segment, productName, productId)
            item.productDescription =  toProductIOMessage('productDescription')(segment, productDescription, productId)
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
