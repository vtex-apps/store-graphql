import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { uniqWith } from 'ramda'

// Be carefull while using uniq. For string comparing, it's more perfomatic using this way
// AHTM
const uniq = uniqWith<string>((a: string, b: string) => a === b)

const isNonEmptyArray = <T>(array?: T[]) => Array.isArray(array) && array.length > 0

const serializeFields = (fields?: string[]) => isNonEmptyArray(fields)
  ? {_fields: uniq(fields).join(',')}
  : {}

export const DEFAULT_USER_FIELDS = ['userId', 'id', 'email']

export class UserDataSource extends RESTDataSource<ServiceContext> {
  constructor() {
    super()
  }

  public attachments = (id: string, field: string) => this.get(
    `/documents/${id}/${field}/attachments`
  )

  public update = (id: string, data: any) => this.patch(
    `/documents/${id}`,
    data
  )

  public search = (params: Record<string, string | void>, fields: string[] = DEFAULT_USER_FIELDS) => this.get(
    '/search',
    {
      ...params,
      ...serializeFields(fields)
    }
  )

  public profile = (id: string, fields: string[] = DEFAULT_USER_FIELDS) => this.get(
    `/documents/${id}`,
    {
      ...serializeFields(fields)
    }
  )

  get baseURL() {
    const {vtex: {account}} = this.context
    return `http://api.vtex.com/${account}/dataentities/CL`
  }

  protected willSendRequest (request: RequestOptions) {
    const {vtex: {authToken}} = this.context
    request.headers.set('Authorization', authToken)
    request.headers.set('Accept', 'application/json')
    request.headers.set('Content-Type', 'application/json')
    request.headers.set('Vtex-Use-Https', 'true')
  }
}
