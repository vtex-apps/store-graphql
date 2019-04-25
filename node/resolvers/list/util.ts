import { UserInputError } from '@vtex/api'
import { filter, path } from 'ramda'

export const fields = ['name', 'isPublic', 'isEditable', 'owner', 'createdIn', 'updatedIn', 'items', 'id']
export const fieldsListProduct = ['id', 'quantity', 'skuId', 'productId', 'createdIn']
export const acronymListProduct = 'LP'
export const acronymList = 'WL'

const checkListItemQuantity = (quantity: any) => {
  if (!quantity || quantity < 0) {
    throw new UserInputError('The item quantity should be greater than 0')
  }
}

// Make this query to check if the skuId received is valid
// If it isn't, it throws an exception.
const checkProduct = async (item: any, catalog: any) => {
  const response = await catalog.productBySku([path(['skuId'], item)])
  if (!response.length) {
    throw new UserInputError('Cannot add an invalid product')
  }
}

const checkDuplicatedListItem = (items: any, item: any) => {
  const itemDuplicated = filter((i: any) => path(['skuId'], i) === path(['skuId'], item), items)
  if (itemDuplicated.length > 1) {
    throw new UserInputError('Cannot add duplicated items.')
  }
}

const validateListItem = (items: any, item: any, dataSources: any) => {
  const { catalog } = dataSources
  checkListItemQuantity(path(['quantity'], item))
  checkDuplicatedListItem(items, item)
  checkProduct(item, catalog)
}

const validateItems = (items = [], dataSources: any) => {
  items.forEach(item => validateListItem(items, item, dataSources))
}

export { validateItems, validateListItem }
