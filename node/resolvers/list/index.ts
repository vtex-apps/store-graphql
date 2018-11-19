import { queries as documentQueries, mutations as documentMutations } from '../document/index'
import { mapKeyValues, parseFieldsToJson } from '../../utils/object'
import ResolverError from '../../errors/resolverError'
import { map, path, nth } from 'ramda'

const fields = ['name', 'isPublic', 'owner', 'createdIn', 'updatedIn']
const fieldsListProduct = ['quantity', 'skuId', 'productId', 'id']
const acronymListProduct = 'LP'
const acronymList = 'WL'

const checkListItemQuantity = quantity => {
  if (!quantity || quantity < 0) {
    throw new ResolverError('The quantity should be greater than 0', 406)
  }
}

const checkDuplicatedListItem = async (_, { listId, skuId }, context) => {
  const request = {
    acronym: acronymListProduct,
    fields: fieldsListProduct,
    filters: [`skuId=${skuId} AND listId=${listId}`],
    page: 1,
  }
  const itemsResponse = await documentQueries.searchDocuments(_, request, context)
  if (itemsResponse.length) {
    throw new ResolverError('Cannot add duplicated items.', 406)
  }
}

const checkNewListItem = async (_, listItem, context) => {
  const { dataSources: { catalog } } = context
  // Make this query to check if the skuId received is valid
  // If it isn't, it throws an exception.
  await catalog.productBySku([path(['skuId'], listItem)])
  await checkDuplicatedListItem(_, listItem, context)
  checkListItemQuantity(path(['quantity', listItem]))
}

const getListItemsWithProductInfo = async (items, catalog) => await Promise.all(
    map(async item => {
      const productsResponse = await catalog.productBySku([path(['skuId'], item)])
      const product = nth(0, productsResponse)
      return { ...item, product }
    }, items)
  )

const getListItems = async (_, args, context) => {
  const { dataSources: { catalog } } = context
  const { id, page } = args
  const requestItems = {
    acronym: acronymListProduct,
    fields: fieldsListProduct,
    filters: [`listId=${id}`],
    page,
  }
  let listItems = await documentQueries.searchDocuments({}, requestItems, context)
  listItems = listItems.map(item => ({ ...parseFieldsToJson(item.fields) }))
  return getListItemsWithProductInfo(listItems, catalog)
}

export const queries = {
  list: async (_, args, context) => {
    const { id } = args
    const request = { acronym: acronymList, fields, id }
    
    const listInfo = await documentQueries.document(_, request, context)
    const items = await getListItems(_, args, context)
    
    return { id, ...parseFieldsToJson(listInfo.fields), items }
  }
}

export const mutation = {
  createList: async (_, args, context) => {
    const { list } = args
    const request = {
      acronym: acronymList,
      document : {
        fields: mapKeyValues(list)
      }
    }
    const { documentId } = await documentMutations.createDocument(_, request, context)
    return await queries.list(_, { id: documentId, page: 1 }, context)
  },

  deleteList: async (_, args, context) => {
    const { id } = args
    const request = { acronym: acronymList, documentId: id }
    const { items } = await queries.list(_, { id, page: 1 }, context)
    items.map(item => mutation.deleteListItem(_, { id: item.id }, context))
    return await documentMutations.deleteDocument(_, request, context)
  },

  updateList: async (_, args, context) => {
    const { list, id } = args
    const request = {
      acronym: acronymList,
      id,
      document : {
        fields: mapKeyValues({...list, id}),
      }
    }
    const response = await documentMutations.updateDocument(_, request, context)
    return await queries.list(_, { id: response.documentId, page: 1 }, context)
  },

  addListItem: async (_, args, context) => {
    const { listItem, listItem: { listId } } = args
    const request = {
      acronym: acronymListProduct,
      document : {
        fields: mapKeyValues(listItem)
      }
    }
    checkNewListItem(_, listItem, context)
    await documentMutations.createDocument(_, request, context)
    return await queries.list(_, { id: listId, page: 1 }, context)
  },

  deleteListItem: async (_, args, context) => {
    return await documentMutations.deleteDocument(_, { acronym: acronymListProduct, documentId: args.id }, context)
  },

  updateListItem: async (_, args, context) => {
    const { listId, itemId, quantity } = args
    const request = {
      acronym: acronymListProduct,
      id: itemId,
      document : {
        fields: mapKeyValues({quantity, id: itemId}),
      }
    }
    checkListItemQuantity(quantity)
    await documentMutations.updateDocument(_, request, context)
    return await queries.list(_, { id: listId, page: 1 }, context)
  }
}