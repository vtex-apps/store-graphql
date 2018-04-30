import http from 'axios'
import paths from '../paths'
import {zipObj, mergeAll} from 'ramda'
import { withAuthToken, headers } from '../headers'

const makeRequest = async (args, ioContext, cookie, method) => {
  const {location, items} = args
  const url = paths.calculateSLA(ioContext.account)
  const {data: {Id, Href, DocumentId}} = await method(
    url, [{items, location}], 
    {headers: withAuthToken()(ioContext, cookie)}
  )
  return {id: Id, href: Href, documentId: DocumentId}
}

export const mutations = {
  calculateSLA: async (_, args, { vtex: ioContext, request: {headers: {cookie}}}) =>
    makeRequest(args, ioContext, cookie, http.post),
}