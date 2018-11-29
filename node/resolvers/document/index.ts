import http from 'axios'
import { union } from 'ramda'
import { withAuthToken, withMDPagination } from '../headers'
import paths from '../paths'
import { uploadAttachment } from './attachment'
import { parseFieldsToJson, mapKeyValues } from '../../utils/object'

export const queries = {
  documents: async (_, args, { dataSources: { document } }) => {
    const { acronym, fields, page, pageSize, where } = args
    const fieldsWithId = union(fields, ['id'])
    const data = await document.searchDocuments(acronym, fieldsWithId, where)
    return data.map(document => ({
      cacheId: document.id,
      fields: mapKeyValues(document),
      id: document.id,
    }))
  },

  document: async (_, args, { dataSources: { document } }) => {
    const { acronym, fields, id } = args
    const data = await document.getDocument(acronym, id, fields)
    return { id, cacheId: id, fields: mapKeyValues(data) }
  },
}

export const mutations = {
  createDocument: async (_, args, { vtex: ioContext }) => {
    const { acronym, document: { fields } } = args
    const url = paths.documents(ioContext.account, acronym)
    const { data: { Id, Href, DocumentId } } = await http.post(
      url, parseFieldsToJson(fields),
      {
        headers: {
          Accept: 'application/vnd.vtex.ds.v10+json',
          Authorization: ioContext.authToken,
          ['Content-Type']: 'application/json',
        },
      },
    )
    return { cacheId: DocumentId, id: Id, href: Href, documentId: DocumentId }
  },

  updateDocument: async (_, args, { vtex: ioContext }) => {
    const { acronym, document: { fields } } = args
    const url = paths.documents(ioContext.account, acronym)
    const { data: { Id, Href, DocumentId } } = await http.patch(
      url, parseFieldsToJson(fields),
      {
        headers: {
          Accept: 'application/vnd.vtex.ds.v10+json',
          Authorization: ioContext.authToken,
          ['Content-Type']: 'application/json',
        },
      },
    )
    return { cacheId: DocumentId, id: Id, href: Href, documentId: DocumentId }
  },

  deleteDocument: async (_, args, { vtex: ioContext }) => {
    const { acronym, documentId } = args
    const url = paths.document(ioContext.account, acronym, documentId)
    await http.delete(
      url,
      {
        headers: {
          Accept: 'application/vnd.vtex.ds.v10+json',
          Authorization: ioContext.authToken,
          ['Content-Type']: 'application/json',
        },
      },
    )
    return {id: documentId}
  },

  uploadAttachment: async (root, args, {vtex: ioContext}, info) => uploadAttachment(args, ioContext)
}
