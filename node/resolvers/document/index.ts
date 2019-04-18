import { prop, union } from 'ramda'
import {parseFieldsToJson }  from '../../utils'
import { mapKeyValues } from '../../utils/object'

export const queries = {
  documents: async (_: any, args: any, { dataSources: { document } }: any) => {
    const { acronym, fields, page, pageSize, where, schema } = args
    const fieldsWithId = union(fields, ['id'])
    const data = schema
      ? await document.searchDocumentsWithSchema(
          acronym,
          fieldsWithId,
          where,
          schema,
          { page, pageSize }
        )
      : await document.searchDocuments(acronym, fieldsWithId, where, {
          page,
          pageSize,
        })
    return data.map((doc: any) => ({
      cacheId: doc.id,
      fields: mapKeyValues(doc),
      id: doc.id,
    }))
  },

  document: async (_: any, args: any, { dataSources: { document } }: any) => {
    const { acronym, fields, id } = args
    const data = await document.getDocument(acronym, id, fields)
    return { id, cacheId: id, fields: mapKeyValues(data) }
  },
}

export const mutations = {
  createDocument: async (_: any, args: any, { dataSources: { document } }: any) => {
    const { acronym, document: { fields } } = args
    const { Id, Href, DocumentId } = await document.createDocument(acronym, fields)
    return { cacheId: DocumentId, id: Id, href: Href, documentId: DocumentId }
  },

  updateDocument: async (_: any, args: any, { dataSources: { document } }: any) => {
    const { acronym, document: { fields } } = args
    const id = prop('id', parseFieldsToJson(fields))
    const { Id, Href, DocumentId } = await document.updateDocument(acronym, id, fields)
    return { cacheId: DocumentId, id: Id, href: Href, documentId: DocumentId }
  },

  deleteDocument: async (_: any, args: any, { dataSources: { document } }: any) => {
    const { acronym, documentId } = args
    await document.deleteDocument(acronym, documentId)
    return { id: documentId }
  }
}
