import { queries as documentQueries } from '../document/index'

const fields = ['name', 'public', 'createdBy', 'createdIn', 'updatedBy', 'updatedIn']

const generateObjJSON = data => Object.assign({}, ...data.map(item => ({ [item.key]: item.value })))

export const queries = {
  getWishList: async (_, args, context) => {
    const { id } = args
    const request = {
      acronym: 'WL',
      fields,
      id,
    }
    const wishListInfo = await documentQueries.document(_, request, context)
    const wishListItems = await documentQueries.searchDocuments(_, { acronym: 'LP', fields: ['quantity', 'productId', 'skuId'], filters: [`wishListId=${id}`], page: 1 }, context)

    const products = wishListItems.map(item => ({ ...generateObjJSON(item.fields) }))
    return { id, ...generateObjJSON(wishListInfo.fields), products }
  }
}