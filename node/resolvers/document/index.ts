import http from 'axios'
import { mergeAll, union, zipObj } from 'ramda'
import ResolverError from '../../errors/resolverError';
import { withAuthToken, withMDPagination } from '../headers'
import paths from '../paths'
import { uploadAttachment } from './attachment';

/**
 * Map a document object to a list of {key: 'property', value: 'propertyValue'}.
 */
const mapKeyValues = (document) => Object.keys(document).map(key => ({
  key,
  value: document[key],
}))

/*
 * Convert a list of fields like [ {key: 'propertyName', value: 'String'}, ... ]
 * to a JSON format.
 */
const parseFieldsToJson = (fields) => mergeAll(
  fields.map(field => zipObj([field.key], [field.value])),
)

export const queries = {
  documents: async (_, args, { vtex: ioContext, request: { headers: { cookie } } }) => {
    const { acronym, fields, page, pageSize } = args
    const fieldsWithId = union(fields, ['id'])
    const url = paths.searchDocument(ioContext.account, acronym, fieldsWithId)
    const { data } = await http.get(url, { headers: withMDPagination()(ioContext, cookie)(page, pageSize) })
    return data.map(document => ({
      cacheId: document.id,
      fields: mapKeyValues(document),
      id: document.id,
    }))
  },

  document: async (_, args, { vtex: ioContext, request: { headers: { cookie } } }) => {
    const { acronym, fields, id } = args
    const url = paths.documentFields(ioContext.account, acronym, fields, id)
    const { data } = await http.get(url, { headers: withAuthToken()(ioContext, cookie) })
    return { cacheId: data.id, id: data.id, fields: mapKeyValues(data) }
  },
}

export const mutations = {
  createDocument: async (_, args, { vtex: ioContext, request: { headers: { cookie } } }) => {
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

  updateDocument: async (_, args, { vtex: ioContext, request: { headers: { cookie } } }) => {
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

  uploadAttachment: async (root, args, {vtex: IOContext}, info) => uploadAttachment(args, IOContext)
}
