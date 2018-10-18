import { queries as documentQueries, mutations as documentMutations } from '../document/index'
import { mapKeyValues, parseFieldsToJson } from '../document/index'

const fields = ['name', 'isPublic', 'createdBy', 'createdIn', 'updatedBy', 'updatedIn']
const fieldsListProduct = ['quantity', 'productId', 'skuId']
const acronymList = 'WL'
const acronymListProduct = 'LP'

export const queries = {
  getWishList: async (_, args, context) => {
    const { id } = args
    const request = { acronym: acronymList, fields, id }
    const requestProducts = {
      acronym: acronymListProduct,
      fields: fieldsListProduct,
      filters: [`wishListId=${id}`],
      page: 1,
    }
    const wishListInfo = await documentQueries.document(_, request, context)
    const wishListItems = await documentQueries.searchDocuments(_, requestProducts, context)
    const products = wishListItems.map(item => ({ ...parseFieldsToJson(item.fields) }))
    return { id, ...parseFieldsToJson(wishListInfo.fields), products }
  }
}

export const mutation = {
  createWishList: async (_, args, context) => {
    const { wishList } = args
    const request = {
      acronym: acronymList,
      document : {
        fields: mapKeyValues(wishList)
      }
    }
    const { documentId } = await documentMutations.createDocument(_, request, context)
    return await queries.getWishList(_, { id: documentId }, context)
  },

  deleteWishList: async (_, args, context) => {
    const { id } = args
    const request = { acronym: acronymList, documentId: id }
    return await documentMutations.deleteDocument(_, request, context)
  },

  updateWishList: async (_, args, context) => {
    const { wishList } = args
    const request = {
      acronym: acronymList,
      id: args.id,
      document : {
        fields: mapKeyValues(wishList),
      }
    }
    const response = await documentMutations.updateDocument(_, request, context)
    return await queries.getWishList(_, { id: response.documentId }, context)
  },

  addWishListItem: async (_, args, context) => {
    const { listItem, listItem: { wishListId } } = args
    const request = {
      acronym: acronymListProduct,
      document : {
        fields: mapKeyValues(listItem)
      }
    }
    await documentMutations.createDocument(_, request, context)
    return await queries.getWishList(_, { id: wishListId }, context)
  }
}