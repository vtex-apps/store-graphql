import {
  AuthenticationError,
  ForbiddenError,
  InstanceOptions,
  IOContext,
  JanusClient,
  RequestConfig,
  UserInputError,
} from '@vtex/api'
import { AxiosError } from 'axios'
import FormData from 'form-data'
import { mergeAll, zipObj } from 'ramda'

interface PaginationArgs {
  page: number
  pageSize: number
}

export interface Document {
  Id: string
  Href: string
  DocumentId: string
  [key: string]: any
}

interface KeyValue {
  key: string
  value: string
}

/*
 * Convert a list of fields like [ {key: 'propertyName', value: 'String'}, ... ]
 * to a JSON format.
 */
const parseFieldsToJson = (fields: KeyValue[]) =>
  mergeAll(fields.map((field: any) => zipObj([field.key], [field.value])))

const statusToError = (e: any) => {
  if (!e.response) {
    throw e
  }
  const { response } = e as AxiosError
  const { status } = response!
  if (status === 401) {
    throw new AuthenticationError(e)
  }
  if (status === 403) {
    throw new ForbiddenError(e)
  }
  if (status === 400) {
    throw new UserInputError(e)
  }
  throw e
}

const paginationArgsToHeaders = ({ page, pageSize }: PaginationArgs) => {
  if (page < 1) {
    throw new UserInputError('Smallest page value is 1')
  }
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  return {
    'REST-Range': `resources=${startIndex}-${endIndex}`,
  }
}

export class MasterData extends JanusClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...(options && options.headers),
        ...{ Accept: 'application/vnd.vtex.ds.v10+json' },
        ...(ctx.adminUserAuthToken
          ? { VtexIdclientAutCookie: ctx.adminUserAuthToken }
          : null),
        ...(ctx.storeUserAuthToken
          ? { [`VtexIdclientAutCookie_${ctx.account}`]: ctx.storeUserAuthToken }
          : null),
      },
    })
  }

  public getDocument = (acronym: string, id: string, fields: string[]) =>
    this.get<Document>(this.routes.document(acronym, id), {
      metric: 'masterdata-getDocument',
      params: { _fields: fields },
    })

  public createDocument = (acronym: string, fields: KeyValue[]) =>
    this.post<Document>(this.routes.documents(acronym), {
      metric: 'masterdata-createDocument',
      params: parseFieldsToJson(fields),
    })

  public updateDocument = (acronym: string, id: string, fields: KeyValue[]) =>
    this.patch<Document>(this.routes.document(acronym, id), {
      metric: 'masterdata-updateDocument',
      params: parseFieldsToJson(fields),
    })

  public searchDocuments = (
    acronym: string,
    fields: string[],
    where: string,
    pagination: PaginationArgs
  ) =>
    this.get<any[]>(this.routes.search(acronym), {
      headers: paginationArgsToHeaders(pagination),
      metric: 'masterdata-searchDocuments',
      params: { _fields: fields, _where: where },
    })

  public deleteDocument = (acronym: string, id: string) =>
    this.delete(this.routes.document(acronym, id), {
      metric: 'masterdata-deleteDocument',
    })

  public uploadAttachment = (
    acronym: string,
    id: string,
    fields: string,
    formData: FormData
  ) =>
    this.post<any>(this.routes.attachments(acronym, id, fields), formData, {
      headers: formData.getHeaders(),
      metric: 'masterdata-uploadAttachment',
    })

  protected get = <T>(url: string, config?: RequestConfig) => {
    return this.http.get<T>(url, config).catch(statusToError)
  }

  protected post = <T>(url: string, data?: any, config?: RequestConfig) => {
    return this.http.post<T>(url, data, config).catch(statusToError)
  }

  protected delete = <T>(url: string, config?: RequestConfig) => {
    return this.http.delete<T>(url, config).catch(statusToError)
  }

  protected patch = <T>(url: string, config?: RequestConfig) => {
    return this.http.patch<T>(url, config).catch(statusToError)
  }

  private get routes() {
    const base = '/api/dataentities'
    return {
      attachments: (acronym: string, id: string, fields: string) =>
        `${acronym}/documents/${id}/${fields}/attachments`,
      document: (acronym: string, id: string) =>
        `${base}/${acronym}/documents/${id}`,
      documents: (acronym: string) => `${base}/${acronym}/documents`,
      search: (acronym: string) => `${base}/${acronym}/search`,
    }
  }
}
