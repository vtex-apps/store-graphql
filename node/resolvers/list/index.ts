import { queries as documentQueries, mutations as documentMutations } from '../document/index'
import { mapKeyValues } from '../../utils/object'
import ResolverError from '../../errors/resolverError'
import { map, path, nth } from 'ramda'

const fields = ['name', 'isPublic', 'owner', 'createdIn', 'updatedIn', 'items', 'id']
const fieldsListProduct = ['id', 'quantity', 'skuId', 'productId']
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
    where: `skuId=${skuId} AND listId=${listId}`,
    page: 1,
  }
  const itemsResponse = await documentQueries.documents(_, request, context)
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

const addItems = async (items, document) => {
  const promises = map(async item => {
    return addListItem(item, document)
  }, items)
  return Promise.all(promises)
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
    return await Promise.all(listsWithProducts)
  }
}

export const mutation = {
  createList: async (_, { list }, context) => {
    const { dataSources: { document } } = context
    const itemsId = await addItems(list.items, document)
    const { DocumentId } = await document.createDocument(acronymList, mapKeyValues({ ...list, items: itemsId }))
    return await queries.list(_, { id: DocumentId }, context)
  },

  deleteList: async (_, { id }, { dataSources: { document } }) => {
    const list = await document.getDocument(acronymList, id, fields)
    map(async itemId => {
      await document.deleteDocument(acronymListProduct, itemId)
    }, list.items)
    return await document.deleteDocument(acronymList, id)
  },

  updateList: async (_, { id, list }, context) => {
    console.log(id, list)
    const waza = await queries.list(_, { id }, context)
    console.log(waza)
    // const { list, id } = args
    // const request = {
    //   acronym: acronymList,
    //   id,
    //   document : {
    //     fields: mapKeyValues({...list, id}),
    //   }
    // }
    // const response = await documentMutations.updateDocument(_, request, context)
    // return await queries.list(_, { id: response.documentId, page: 1 }, context)
    return true
  },

  // updateListItem: async (_, args, context) => {
  //   const { listId, itemId, quantity } = args
  //   const request = {
  //     acronym: acronymListProduct,
  //     id: itemId,
  //     document : {
  //       fields: mapKeyValues({quantity, id: itemId}),
  //     }
  //   }
  //   checkListItemQuantity(quantity)
  //   await documentMutations.updateDocument(_, request, context)
  //   return await queries.list(_, { id: listId, page: 1 }, context)
  // }
}