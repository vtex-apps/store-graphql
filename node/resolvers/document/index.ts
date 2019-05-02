import { prop, union } from 'ramda'
import { parseFieldsToJson } from '../../utils'
import { mapKeyValues } from '../../utils/object'

export const queries = {
  documents: (
    _: any,
    { acronym, fields, page, pageSize, where }: DocumentsArgs,
    { clients: { masterdata } }: Context
  ) => {
    const fieldsWithId = union(fields, ['id'])

    return masterdata
      .searchDocuments(acronym, fieldsWithId, where, { page, pageSize })
      .then(data =>
        data.map((doc: any) => ({
          cacheId: doc.id,
          fields: mapKeyValues(doc),
          id: doc.id,
        }))
      )
  },

  document: (
    _: any,
    { acronym, fields, id }: DocumentArgs,
    { clients: { masterdata } }: Context
  ) =>
    masterdata
      .getDocument(acronym, id, fields)
      .then(data => ({ id, cacheId: id, fields: mapKeyValues(data) })),
}

export const mutations = {
  createDocument: async (
    _: any,
    { acronym, document: { fields } }: any,
    { clients: { masterdata } }: Context
  ) => {
    const { Id, Href, DocumentId } = await masterdata.createDocument(
      acronym,
      fields
    )
    return { cacheId: DocumentId, id: Id, href: Href, documentId: DocumentId }
  },

  updateDocument: async (
    _: any,
    args: any,
    { clients: { masterdata } }: Context
  ) => {
    const {
      acronym,
      document: { fields },
    } = args
    const id = prop('id', parseFieldsToJson(fields)) as string
    const { Id, Href, DocumentId } = await masterdata.updateDocument(
      acronym,
      id,
      fields
    )
    return { cacheId: DocumentId, id: Id, href: Href, documentId: DocumentId }
  },

  deleteDocument: async (
    _: any,
    args: any,
    { clients: { masterdata } }: Context
  ) => {
    const { acronym, documentId } = args
    await masterdata.deleteDocument(acronym, documentId)
    return { id: documentId }
  },
}
