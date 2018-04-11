import http from 'axios'
import paths from '../paths'
import {map, keys, zipObj, mergeAll} from 'ramda'
import { withAuthToken, headers } from '../headers'

export const queries = {
  documents: async (_, args, { vtex: ioContext, request: {headers: {cookie}}}) => {
    const {acronym, fields} = args
    const url = paths.searchDocument(ioContext.account, acronym, fields)
    const {data} = await http.get(url, {headers: withAuthToken()(ioContext, cookie) })
    return data.map(document => ({
      id: document.id,
      fields: Object.keys(document).map(key => ({
        key,
        value: document[key]
      }))
    }))
  },

  document: async (_, args, { vtex: ioContext, request: {headers: {cookie}}}) => {
    const {acronym, fields, id} = args
    const url = paths.document(ioContext.account, acronym, fields, id)
    const {data} = await http.get(url, {headers: withAuthToken()(ioContext, cookie) })
    return {
      id: data.id,
      fields: Object.keys(data).map(key => ({
        key,
        value: data[key]
      }))
    }
  },
}

export const mutations = {
  createDocument: async (_, args, { vtex: ioContext, request: {headers: {cookie}}}) => {
    const {acronym, documents: {fields}} = args
    const url = paths.documents(ioContext.account, acronym)
    const body = mergeAll(fields.map(field => zipObj([field.key], [field.value])))
    const {data} = await http.post(url, body, {headers: withAuthToken()(ioContext, cookie) })
    console.log(data)
    // return {
    //   id: data.
    // }
  } 
}