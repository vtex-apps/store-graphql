import { union } from 'ramda'
import { uploadAttachment } from './attachment'
import { mapKeyValues } from '../../utils/object'

export const queries = {
  documents: async (_, args, { dataSources: { document } }) => {
    const { acronym, fields, page, pageSize, where } = args
    const fieldsWithId = union(fields, ['id'])
    const data = await document.searchDocuments(acronym, fieldsWithId, where, { page, pageSize })
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
  createDocument: async (_, args, { dataSources: { document } }) => {
    const { acronym, document: { fields } } = args
    const { Id, Href, DocumentId } = await document.createDocument(acronym, fields)
    return { cacheId: DocumentId, id: Id, href: Href, documentId: DocumentId }
  },

  updateDocument: async (_, args, { dataSources: { document } }) => {
    const { acronym, document: { fields } } = args
    const { Id, Href, DocumentId } = await document.updateDocument(acronym, fields)
    return { cacheId: DocumentId, id: Id, href: Href, documentId: DocumentId }
  },

  deleteDocument: async (_, args, { dataSources: { document } }) => {
    const { acronym, documentId } = args
    await document.deleteDocument(acronym, documentId)
    return { id: documentId }
  }
}
