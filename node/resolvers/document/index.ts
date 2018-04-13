import http from 'axios'
import paths from '../paths'
import {zipObj, mergeAll} from 'ramda'
import { withAuthToken, headers } from '../headers'

/**
 * Map a document object to a list of {key: 'property', value: 'propertyValue'}.
 */
const mapKeyValues = (document) => Object.keys(document).map(key => ({
  key,
  value: document[key]
}))

/* 
 * Convert a list of fields like [ {key: 'propertyName', value: 'String'}, ... ]
 * to a JSON format. 
 */
const parseFieldsToJson = (fields) => mergeAll(
  fields.map(field => zipObj([field.key], [field.value]))
)

export const queries = {
  documents: async (_, args, { vtex: ioContext, request: {headers: {cookie}}}) => {
    const {acronym, fields} = args
    const url = paths.searchDocument(ioContext.account, acronym, fields)
    const {data} = await http.get(url, {headers: withAuthToken()(ioContext, cookie)})
    return data.map(document => ({
      id: document.id,
      fields: mapKeyValues(document)
    }))
  },

  document: async (_, args, { vtex: ioContext, request: {headers: {cookie}}}) => {
    const {acronym, fields, id} = args
    const url = paths.documentFields(ioContext.account, acronym, fields, id)
    const {data} = await http.get(url, {headers: withAuthToken()(ioContext, cookie)})
    return {id: data.id, fields: mapKeyValues(data)}
  },
}

const makeRequest = async (args, ioContext, cookie, method) => {
  const {acronym, document: {fields}} = args
  const url = paths.documents(ioContext.account, acronym)
  const {data: {Id, Href, DocumentId}} = await method(
    url, parseFieldsToJson(fields), 
    {headers: withAuthToken()(ioContext, cookie)}
  )
  return {id: Id, href: Href, documentId: DocumentId}
}

export const mutations = {
  createDocument: async (_, args, { vtex: ioContext, request: {headers: {cookie}}}) =>
    makeRequest(args, ioContext, cookie, http.get),

  updateDocument: async (_, args, { vtex: ioContext, request: {headers: {cookie}}}) =>
    makeRequest(args, ioContext, cookie, http.patch),

  deleteDocument: async (_, args, { vtex: ioContext, request: {headers: {cookie}}}) => {
    const {acronym, id} = args
    const url = paths.document(ioContext.account, acronym, id)
    const {data: status} = await http.delete(url, {headers: withAuthToken()(ioContext, cookie)})
    return status
  }
}