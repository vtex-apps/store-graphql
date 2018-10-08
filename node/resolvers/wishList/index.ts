import http from 'axios'
import { mergeAll, union, zipObj } from 'ramda'
import ResolverError from '../../errors/resolverError'
import { uploadAttachment } from '../document/attachment'
import { withMDPagination } from '../headers'
import httpResolver from '../httpResolver'
import paths from '../paths'
import { queries as documentQueries } from '../document/index'

/**
 * Map a document object to a list of {key: 'property', value: 'propertyValue'}.
 */
const mapKeyValues = (document) => Object.keys(document).map(key => ({
  key,
  value: document[key],
}))

export const queries = {
  getWishList: async (_, args, context) => {
    const { id, pageSize } = args
    const fields = ['name', 'public', 'createdBy', 'createdIn', 'updatedBy', 'updatedIn']
    // const fieldsWithId = union(fields, ['id'])
    // const url = paths.searchDocuments(ioContext.account, "WL", fieldsWithId, `id=${id}`)
    // console.log(url)
    // const { data } = await http.get(url, { headers: withMDPagination()(ioContext, cookie)(1, pageSize) })
    // console.log(data)
    // const response = {
    //   cacheId: data[0].id,
    //   id: data[0].id ,
    //   name: data[0].name,
    //   createdBy: data[0].createdBy,
    // }

    console.log(context)

    const response = await context.document("WL", fields, id, context)

    console.log(response)

    return response
  } 
}