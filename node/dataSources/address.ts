import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { uniq } from 'ramda'

const isNonEmptyArray = <T>(array?: T[]) => Array.isArray(array) && array.length > 0

const serializeFields = (fields?: string[]) => isNonEmptyArray(fields)
  ? {_fields: uniq(fields).join(',')}
  : {}

export const DEFAULT_ADDRESS_FIELDS = ['userId', 'id', 'receiverName', 'complement', 'neighborhood', 'country', 'state', 'number', 'street', 'postalCode', 'city', 'reference', 'addressName', 'addressType', 'geoCoordinate']

export class AddressDataSource extends RESTDataSource<ServiceContext> {
  constructor() {
    super()
  }

  public create = (data: any) => this.post(
    '/documents',
    data
  )

  public serach = (params: Record<string, string | void>, fields: string[] = DEFAULT_ADDRESS_FIELDS) => this.get(
    '/search',
    {
      ...params,
      ...serializeFields(fields)
    }
  )

  public update = (id: string, data: any) => this.patch(
    `/documents/${id}`,
    data
  )

  public remove = (id: string) => this.delete(
    `/documents/${id}`
  )

  public getById = (id: string) => this.get(
    `/documents/${id}`
  )

  get baseURL() {
    const {vtex: {account}} = this.context
    return `http://api.vtex.com/${account}/dataentities/AD`
  }

  protected willSendRequest (request: RequestOptions) {
    const {vtex: {authToken}} = this.context
    request.headers.set('Authorization', authToken)
    request.headers.set('Content-Type', 'application/json')
    request.headers.set('Accept', 'application/json')
  }
}
