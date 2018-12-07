import { mapKeyValues } from '../../utils/object'
import ResolverError from '../../errors/resolverError'
import { map, path, nth, filter } from 'ramda'

const fields = ['name', 'isPublic', 'owner', 'createdIn', 'updatedIn', 'items', 'id']
const fieldsListProduct = ['id', 'quantity', 'skuId', 'productId']
const acronymListProduct = 'LP'
const acronymList = 'WL'

const checkListItemQuantity = quantity => {
  if (!quantity || quantity < 0) {
    throw 'The item quantity should be greater than 0'
  }
}

// Make this query to check if the skuId received is valid
  // If it isn't, it throws an exception.
const checkProduct = async (item, catalog) => {
  const response = await catalog.productBySku([path(['skuId'], item)])
  if (!response.length) throw 'Cannot add an invalid product'
}

const checkDuplicatedListItem = (items, item) => {
  const itemDuplicated = filter(i => i.skuId === item.skuId, items)
  if (itemDuplicated.length > 1) {
    throw 'Cannot add duplicated items.'
  }
}

const checkNewListItem = (items, item, dataSources) => {
  const { catalog } = dataSources
  checkListItemQuantity(path(['quantity'], item))
  checkDuplicatedListItem(items, item)
  checkProduct(item, catalog)
}

const validateItems = (items = [], dataSources) => {
  map(item => {
    checkNewListItem(items, item, dataSources)
  }, items)
}

const getListItemsWithProductInfo = (items, catalog) => Promise.all(
    map(async item => {
      const productsResponse = await catalog.productBySku([path(['skuId'], item)])
      const product = nth(0, productsResponse)
      return { ...item, product }
    }, items)
  )

const getListItems = async (itemsId, dataSources) => {
  const { catalog, document } = dataSources
  const items = itemsId ? await Promise.all(map(itemId => {
    return document.getDocument(acronymListProduct, itemId, fieldsListProduct)
  }, itemsId)) : []
  return await getListItemsWithProductInfo(items, catalog)
}

const addListItem = async (item, document) => {
  const { DocumentId } = await document.createDocument(acronymListProduct, mapKeyValues({ ...item }))
  return DocumentId
}

const addItems = async (items = [], dataSources) => {
  const { document } = dataSources
  validateItems(items, dataSources)
  const promises = map(async item => {
    return addListItem(item, document)
  }, items)
  return Promise.all(promises)
}

const updateItems = async (items, dataSources) => {
  const { document } = dataSources
  const itemsId = await Promise.all(map(async item => {
    if (item.itemId) {
      if (!item.quantity) {
        await document.deleteDocument(acronymListProduct, item.itemId)
        return 'undefined'
      } else {
        checkNewListItem(items, item, dataSources)
        await document.updateDocument(acronymListProduct, item.itemId, mapKeyValues(item))
        return item.itemId
      }
    } else {
      checkNewListItem(items, item, dataSources)
      const { DocumentId } = await document.createDocument(acronymListProduct, mapKeyValues(item))
      return DocumentId
    }
  }, items))
  const itemsUpdated = filter(item => item !== 'undefined', itemsId)
  return itemsUpdated
}

export const queries = {
  list: async (_, { id }, { dataSources, dataSources: { document } }) => {
    const list = await document.getDocument(acronymList, id, fields)
    const items = await getListItems(list.items, dataSources)
    return { id, ...list, items }
  },

  listsByOwner: async (_, { owner }, context) => {
    const { dataSources, dataSources: { document } } = context
    const lists = await document.searchDocuments(acronymList, fields, `owner=${owner}`)
    const listsWithProducts = map(async list => {
      const items = await getListItems(list.items, dataSources)
      return { ...list, items }
    }, lists)
    return Promise.all(listsWithProducts)
  }
}

export const mutation = {
  createList: async (_, { list, list: { items } }, context) => {
    const { dataSources, dataSources: { document } } = context
    try {
      const itemsId = await addItems(items, dataSources)
      const { DocumentId } = await document.createDocument(acronymList, mapKeyValues({ ...list, items: itemsId }))
      return queries.list(_, { id: DocumentId }, context)
    } catch (error) {
      throw new ResolverError(`Cannot create list: ${error}`, 406)
    }
  },

  deleteList: async (_, { id }, { dataSources: { document } }) => {
    const list = await document.getDocument(acronymList, id, fields)
    map(async itemId => {
      await document.deleteDocument(acronymListProduct, itemId)
    }, list.items)
    return document.deleteDocument(acronymList, id)
  },

  /**
   * Update the list informations and its items.
   * If the item given does not have the itemId, add it as a new item in the list
   * If the item given has got an itemId, but its quantity is 0, remove it from the list
   * Otherwise, update it.
   */
  updateList: async (_, { id, list, list: { items } }, context) => {
    const { dataSources, dataSources: { document } } = context
    try {
      const itemsUpdatedId = await updateItems(items, dataSources)
      await document.updateDocument(acronymList, id, mapKeyValues({ ...list, items: itemsUpdatedId }))
      return queries.list(_, { id }, context)
    } catch (error) {
      throw new ResolverError(`Cannot update the list: ${error}`, 406)
    }
  },
}