import { RESTDataSource } from 'apollo-datasource-rest'
import FormData from 'form-data'
import { forEachObjIndexed } from 'ramda'

import { withMDPagination } from '../resolvers/headers'
import { parseFieldsToJson } from '../utils'

interface PaginationArgs {
  page: string,
  pageSize: string
}

const withDocumentHeaders: Modifier = (opts: ModOpts, {vtex, cookie}: Context) => {
  const page = opts.headers.get('page')
  const pageSize = opts.headers.get('pageSize')
  const formDataHeaders = opts.headers.get('formDataHeaders')

  let headers = {}
  if (page && pageSize) {
    headers = withMDPagination()(vtex, cookie as any)(+page, +pageSize)
  } else if (formDataHeaders) {
    headers = {
      'Proxy-Authorization': vtex.authToken,
      'VtexIdclientAutCookie': vtex.authToken,
      ...formDataHeaders
    }
  } else {
    headers = {
      Accept: 'application/vnd.vtex.ds.v10+json',
      Authorization: vtex.authToken
    }
  }

  forEachObjIndexed((value, key) => opts.headers.set(key, value), headers)
  return opts
}

export class DocumentDataSource extends OutboundDataSource<Context> {
  constructor() {
    super()
  }

  protected modifiers = [
    withDocumentHeaders,
  ]

  public getDocument = (acronym: string, id: string, fields: string[]) => this.http.get(
    `${acronym}/documents/${id}`,
    { _fields: fields }
  )

  public searchDocuments = (acronym: string, fields: string[], where: string, pagination: PaginationArgs) => this.http.get(
    `${acronym}/search`,
    { _fields: fields, _where: where },
    { headers: { ...pagination } }
  )

  public createDocument = (acronym: string, fields: string[]) => this.http.post(
    `${acronym}/documents`,
    parseFieldsToJson(fields)
  )

  public updateDocument = (acronym: string, id: string, fields: string[]) => this.http.patch(
    `${acronym}/documents/${id}`,
    parseFieldsToJson(fields)
  )

  public deleteDocument = (acronym: string, documentId: string) => this.http.delete(
    `${acronym}/documents/${documentId}`
  )

  public uploadAttachment = (acronym: string, documentId: string, fields: string, formData: FormData) => this.http.post(
    `${acronym}/documents/${documentId}/${fields}/attachments`,
    formData,
    { headers: { formDataHeaders: { ...formData.getHeaders() } } }
  )

  // public willSendRequest(request) {
  //   const { vtex, cookie } = this.context
  //   const page = request.headers.get('page')
  //   const pageSize = request.headers.get('pageSize')
  //   const formDataHeaders = request.headers.get('formDataHeaders')

  //   let headers = {}
  //   if (page && pageSize) {
  //     headers = withMDPagination()(vtex, cookie as any)(+page, +pageSize)
  //   } else if (formDataHeaders) {
  //     headers = {
  //       'Proxy-Authorization': this.context.vtex.authToken,
  //       'VtexIdclientAutCookie': this.context.vtex.authToken,
  //       ...formDataHeaders
  //     }
  //   } else {
  //     headers = {
  //       Accept: 'application/vnd.vtex.ds.v10+json',
  //       Authorization: this.context.vtex.authToken
  //     }
  //   }

  //   forEachObjIndexed((value, key) => request.headers.set(key, value), headers)
  // }

  get baseURL() {
    const { vtex: { account } } = this.context
    return `http://api.vtex.com/${account}/dataentities/`
  }
}
