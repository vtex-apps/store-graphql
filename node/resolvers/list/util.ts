import { UserInputError } from '@vtex/api'
import { filter, path } from 'ramda'

import { Clients } from '../../clients'
import { Catalog } from '../../clients/catalog'

export const fields = [
  'name',
  'isPublic',
  'isEditable',
  'owner',
  'createdIn',
  'updatedIn',
  'items',
  'id',
]
export const fieldsListProduct = [
  'id',
  'quantity',
  'skuId',
  'productId',
  'createdIn',
]
export const acronymListProduct = 'LP'
export const acronymList = 'WL'

export interface Item {
  id: string
  skuId: string
  productId: string
  quantity: number
}

const checkListItemQuantity = (quantity: any) => {
  if (!quantity || quantity < 0) {
    throw new UserInputError('The item quantity should be greater than 0')
  }
}

// Make this query to check if the skuId received is valid
// If it isn't, it throws an exception.
const checkProduct = async (item: Item, catalog: Catalog) => {
  const response = await catalog.productBySku([path(['skuId'], item) as string])

  if (!response.length) {
    throw new UserInputError('Cannot add an invalid product')
  }
}

const checkDuplicatedListItem = (items: Item[], item: Item) => {
  const itemDuplicated = filter(
    (i: Item) => path(['skuId'], i) === path(['skuId'], item),
    items
  )

  if (itemDuplicated.length > 1) {
    throw new UserInputError('Cannot add duplicated items.')
  }
}

const validateListItem = (items: Item[], item: Item, clients: Clients) => {
  const { catalog } = clients

  checkListItemQuantity(path(['quantity'], item))
  checkDuplicatedListItem(items, item)
  checkProduct(item, catalog)
}

// eslint-disable-next-line @typescript-eslint/default-param-last
const validateItems = (items: Item[] = [], clients: Clients) => {
  items.forEach((item) => validateListItem(items, item, clients))
}

export { validateItems, validateListItem }
