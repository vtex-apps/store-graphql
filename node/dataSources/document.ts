import FormData from 'form-data'
import { forEachObjIndexed } from 'ramda'

import { withMDPagination } from '../resolvers/headers'
import { parseFieldsToJson } from '../utils'
import { RESTDataSource } from './RESTDataSource'

interface PaginationArgs {
  page: string,
  pageSize: string
}

export class DocumentDataSource extends RESTDataSource {
  constructor() {
    super()
  }

  public getDocument = (acronym: string, id: string, fields: string[]) => this.get(
    `${acronym}/documents/${id}`,
    { _fields: fields },
    {metric: 'masterdata-getDocument'}
  )

  public searchDocuments = (acronym: string, fields: string[], where: string, pagination: PaginationArgs) => this.get(
    `${acronym}/search`,
    { _fields: fields, _where: where },
    { headers: { ...pagination } , metric: 'masterdata-searchDocuments'}
  )

  public searchDocumentsWithSchema = (acronym: string, fields: string[], where: string, schema: string, pagination: PaginationArgs) => this.get(
    `${acronym}/search`,
    { _fields: fields, _where: where, _schema: schema },
    { headers: { ...pagination } , metric: 'masterdata-searchDocumentsWithSchema'}
  )

  public createDocument = (acronym: string, fields: string[]) => this.post(
    `${acronym}/documents`,
    parseFieldsToJson(fields),
    {metric: 'masterdata-createDocument'}
  )

  public updateDocument = (acronym: string, id: string, fields: string[]) => this.patch(
    `${acronym}/documents/${id}`,
    parseFieldsToJson(fields),
    {metric: 'masterdata-updateDocument'}
  )

  public deleteDocument = (acronym: string, documentId: string) => this.delete(
    `${acronym}/documents/${documentId}`,
    undefined,
    {metric: 'masterdata-deleteDocument'}
  )

  public uploadAttachment = (acronym: string, documentId: string, fields: string, formData: FormData) => this.post(
    `${acronym}/documents/${documentId}/${fields}/attachments`,
    formData,
    { headers: { formDataHeaders: { ...formData.getHeaders() } } as any, metric: 'masterdata-uploadAttachment'}
  )

  public willSendRequest(request: any) {
    const { vtex, cookie } = this.context as any
    const page = request.headers.get('page')
    const pageSize = request.headers.get('pageSize')
    const formDataHeaders = request.headers.get('formDataHeaders')

    let headers = {}
    if (page && pageSize) {
      headers = withMDPagination()(vtex, cookie as any)(+page, +pageSize)
    } else if (formDataHeaders) {
      headers = {
        'Proxy-Authorization': this.context.vtex.authToken,
        'VtexIdclientAutCookie': this.context.vtex.authToken,
        ...formDataHeaders
      }
    } else {
      headers = {
        Accept: 'application/vnd.vtex.ds.v10+json',
        Authorization: this.context.vtex.authToken
      }
    }

    forEachObjIndexed((value, key) => request.headers.set(key, value), headers)
  }

  get baseURL() {
    const { vtex: { account } } = this.context
    return `http://api.vtex.com/${account}/dataentities/`
  }
}
