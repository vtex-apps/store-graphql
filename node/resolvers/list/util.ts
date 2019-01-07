import { filter, path } from 'ramda'

export const fields = ['name', 'isPublic', 'owner', 'createdIn', 'updatedIn', 'items', 'id']
export const fieldsListProduct = ['id', 'quantity', 'skuId', 'productId', 'createdIn']
export const acronymListProduct = 'LP'
export const acronymList = 'WL'

const checkListItemQuantity = quantity => {
  if (!quantity || quantity < 0) {
    throw new Error('The item quantity should be greater than 0')
  }
}

// Make this query to check if the skuId received is valid
// If it isn't, it throws an exception.
const checkProduct = async (item, catalog) => {
  const response = await catalog.productBySku([path(['skuId'], item)])
  if (!response.length) {
    throw new Error('Cannot add an invalid product')
  }
}

const checkDuplicatedListItem = (items, item) => {
  const itemDuplicated = filter(i => path(['skuId'], i) === path(['skuId'], item), items)
  if (itemDuplicated.length > 1) {
    throw new Error('Cannot add duplicated items.')
  }
}

const validateListItem = (items, item, dataSources) => {
  const { catalog } = dataSources
  checkListItemQuantity(path(['quantity'], item))
  checkDuplicatedListItem(items, item)
  checkProduct(item, catalog)
}

const validateItems = (items = [], dataSources) => {
  items.forEach(item => validateListItem(items, item, dataSources))
}

export { validateItems, validateListItem }