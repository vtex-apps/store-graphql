import { queries as documentQueries, mutations as documentMutations } from '../document/index'
import { mapKeyValues, parseFieldsToJson } from '../document/index'

const fields = ['name', 'isPublic', 'createdBy', 'createdIn', 'updatedBy', 'updatedIn']
const fieldsListProduct = ['quantity', 'productId', 'skuId', 'id']
const acronymList = 'WL'
const acronymListProduct = 'LP'

export const queries = {
  list: async (_, args, context) => {
    const { id } = args
    const request = { acronym: acronymList, fields, id }
    const requestProducts = {
      acronym: acronymListProduct,
      fields: fieldsListProduct,
      filters: [`listId=${id}`],
      page: 1,
    }
    const listInfo = await documentQueries.document(_, request, context)
    const listItems = await documentQueries.searchDocuments(_, requestProducts, context)
    const products = listItems.map(item => ({ ...parseFieldsToJson(item.fields) }))
    // Get products information from Catalog
    return { id, ...parseFieldsToJson(listInfo.fields), products }
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
    return await queries.list(_, { id: documentId }, context)
  },

  deleteList: async (_, args, context) => {
    const { id } = args
    const request = { acronym: acronymList, documentId: id }
    const { products } = await queries.list(_, { id }, context)
    products.map(item => mutation.deleteListItem(_, { id: item.id }, context))
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
    return await queries.list(_, { id: response.documentId }, context)
  },

  addListItem: async (_, args, context) => {
    const { listItem, listItem: { listId } } = args
    const request = {
      acronym: acronymListProduct,
      document : {
        fields: mapKeyValues(listItem)
      }
    }
    await documentMutations.createDocument(_, request, context)
    return await queries.list(_, { id: listId }, context)
  },

  deleteListItem: async (_, args, context) => {
    return await documentMutations.deleteDocument(_, {acronym: acronymListProduct, documentId: args.id}, context)
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
    await documentMutations.updateDocument(_, request, context)
    return await queries.list(_, { id: listId }, context)
  }
}