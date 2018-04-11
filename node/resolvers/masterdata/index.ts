import http from 'axios'
import paths from '../paths'
import {map, keys} from 'ramda'
import { withAuthToken, headers } from '../headers'

export const queries = {
  masterObjects: async (_, args, { vtex: ioContext, request: {headers: {cookie}}}) => {
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
}