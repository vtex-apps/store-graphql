import { RESTDataSource } from 'apollo-datasource-rest'
import { withMDPagination } from '../resolvers/headers'
import { parseFieldsToJson } from '../utils'

export class DocumentDataSource extends RESTDataSource<ServiceContext> {
  constructor() {
    super()
  }

  public getDocument = (acronym, id, fields) => this.get(
    `${acronym}/documents/${id}`,
    { _fields: fields }
  )

  public searchDocuments = (acronym, _fields, _where, { page, pageSize}) => this.get(
    `${acronym}/search`,
    { _fields, _where },
    { page, pageSize }
  )

  public createDocument = (acronym, fields) => this.post(
    `${acronym}/documents`,
    parseFieldsToJson(fields)
  )

  public updateDocument = (acronym, id, fields) => this.patch(
    `${acronym}/documents/${id}`,
    parseFieldsToJson(fields)
  )

  public deleteDocument = (acronym, documentId) => this.delete(
    `${acronym}/documents/${documentId}`
  )

  public willSendRequest(request) {
    const { vtex, cookie } = this.context
    const { page, pageSize } = request
    if (page && pageSize) {
      request.headers = withMDPagination()(vtex, cookie)(page, pageSize)
    } else {
      request.headers = {
        Authorization: this.context.vtex.authToken,
        Accept: 'application/vnd.vtex.ds.v10+json'
      }
    }
  }

  get baseURL() {
    const { vtex: { account } } = this.context
    return `http://api.vtex.com/${account}/dataentities/`
  }
}