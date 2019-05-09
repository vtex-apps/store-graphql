import { Document } from './masterdata'
import {
  AuthenticationError,
  ForbiddenError,
  InstanceOptions,
  IOContext,
  ExternalClient,
  RequestConfig,
  UserInputError,
} from '@vtex/api'
import { AxiosError } from 'axios'
import FormData from 'form-data'

export class MasterData extends ExternalClient {
  public constructor(ctx: IOContext, options?: InstanceOptions) {
    super(`http://api.vtex.com/${ctx.account}/dataentities`, ctx, {
      ...options,
      headers: {
        ...(options && options.headers),
        ...{ Accept: 'application/vnd.vtex.ds.v10+json' },
        ...(ctx.adminUserAuthToken
          ? { VtexIdclientAutCookie: ctx.adminUserAuthToken }
          : null),
        ...(ctx.storeUserAuthToken
          ? { VtexIdclientAutCookie: ctx.storeUserAuthToken }
          : null),
      },
    })
  }

  public getDocument = <T>(acronym: string, id: string, fields: string[]) =>
    this.get<T & Document>(this.routes.document(acronym, id), {
      metric: 'masterdata-getDocument',
      params: {
        _fields: generateFieldsArg(fields),
      },
    })

  public createDocument = (acronym: string, fields: object) =>
    this.post<Document>(this.routes.documents(acronym), fields, {
      metric: 'masterdata-createDocument',
    })

  public updateDocument = (acronym: string, id: string, fields: object) =>
    this.patch<Document>(this.routes.document(acronym, id), fields, {
      metric: 'masterdata-updateDocument',
    })

  public searchDocuments = <T>(
    acronym: string,
    fields: string[],
    where: string,
    pagination: PaginationArgs
  ) =>
    this.get<T[]>(this.routes.search(acronym), {
      headers: paginationArgsToHeaders(pagination),
      metric: 'masterdata-searchDocuments',
      params: { _fields: generateFieldsArg(fields), _where: where },
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

  protected patch = <T>(url: string, data?: any, config?: RequestConfig) => {
    return this.http.patch<T>(url, data, config).catch(statusToError)
  }

  private get routes() {
    return {
      attachments: (acronym: string, id: string, fields: string) =>
        `${acronym}/documents/${id}/${fields}/attachments`,
      document: (acronym: string, id: string) => `${acronym}/documents/${id}`,
      documents: (acronym: string) => `${acronym}/documents`,
      search: (acronym: string) => `${acronym}/search`,
    }
  }
}

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

function paginationArgsToHeaders({ page, pageSize }: PaginationArgs) {
  if (page < 1) {
    throw new UserInputError('Smallest page value is 1')
  }

  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize

  return {
    'REST-Range': `resources=${startIndex}-${endIndex}`,
  }
}

function generateFieldsArg(fields: string[]) {
  return fields.reduce((previous, current) => `${previous}${current},`, '')
}

export interface Document {
  Id: string
  Href: string
  DocumentId: string
  [key: string]: any
}

interface PaginationArgs {
  page: number
  pageSize: number
}
