import { prop } from 'ramda'

import { retrieveDocument, retrieveDocuments } from './services'
import { parseFieldsToJson } from '../../utils'

export const queries = {
  documents: (_: any, args: DocumentsArgs, context: Context) =>
    retrieveDocuments({ args, context }),

  document: (_: any, args: DocumentArgs, context: Context) =>
    retrieveDocument({ context, args }),
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
