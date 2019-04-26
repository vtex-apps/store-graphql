import { prop, union } from 'ramda'
import {parseFieldsToJson }  from '../../utils'
import { mapKeyValues } from '../../utils/object'

export const queries = {
  documents: async (_: any, args: any, { clients: { masterdata } }: Context) => {
    const { acronym, fields, page, pageSize, where } = args
    const fieldsWithId = union(fields, ['id'])
    const data = await masterdata.searchDocuments(acronym, fieldsWithId as any, where, { page, pageSize })
    return data.map((doc: any) => ({
      cacheId: doc.id,
      fields: mapKeyValues(doc),
      id: doc.id,
    }))
  },

  document: async (_: any, args: any, { clients: { masterdata } }: Context) => {
    const { acronym, fields, id } = args
    const data = await masterdata.getDocument(acronym, id, fields)
    return { id, cacheId: id, fields: mapKeyValues(data) }
  },
}

export const mutations = {
  createDocument: async (_: any, args: any, { clients: { masterdata } }: Context) => {
    const { acronym, document: { fields } } = args
    const { Id, Href, DocumentId } = await masterdata.createDocument(acronym, fields)
    return { cacheId: DocumentId, id: Id, href: Href, documentId: DocumentId }
  },

  updateDocument: async (_: any, args: any, { clients: { masterdata } }: Context) => {
    const { acronym, document: { fields } } = args
    const id = prop('id', parseFieldsToJson(fields)) as string
    const { Id, Href, DocumentId } = await masterdata.updateDocument(acronym, id, fields)
    return { cacheId: DocumentId, id: Id, href: Href, documentId: DocumentId }
  },

  deleteDocument: async (_: any, args: any, { clients: { masterdata } }: Context) => {
    const { acronym, documentId } = args
    await masterdata.deleteDocument(acronym, documentId)
    return { id: documentId }
  }
}
