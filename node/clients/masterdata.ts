import {
  InstanceOptions,
  IOContext,
  ExternalClient,
  RequestConfig,
  UserInputError,
} from '@vtex/api'
import FormData from 'form-data'
import validator from 'validator'

import { statusToError } from '../utils'

const DATAENTITIES_PREFIX = '/dataentities'

export class MasterData extends ExternalClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(`http://api.vtex.com/${ctx.account}`, ctx, {
      ...options,
      headers: {
        ...options?.headers,
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

  public getSchema = <T>(dataEntity: string, schema: string) =>
    this.get<T>(this.routes.schema(dataEntity, schema), {
      metric: 'masterdata-getSchema',
    })

  public getPublicSchema = <T>(dataEntity: string, schema: string) =>
    this.get<T>(this.routes.publicSchema(dataEntity, schema), {
      metric: 'masterdata-getPublicSchema',
    })

  public getDocument = <T>(
    acronym: string,
    id: string,
    fields: string[],
    account?: string
  ) =>
    this.get<T>(this.routes.document(acronym, id), {
      metric: 'masterdata-getDocument',
      params: {
        _fields: generateFieldsArg(fields),
        ...(account ? { an: account } : null),
      },
    })

  public createDocument = (
    acronym: string,
    // eslint-disable-next-line @typescript-eslint/ban-types
    fields: object,
    schema?: string,
    account?: string
  ) =>
    this.post<DocumentResponse>(this.routes.documents(acronym), fields, {
      metric: 'masterdata-createDocument',
      params: {
        ...(schema ? { _schema: schema } : null),
        ...(account ? { an: account } : null),
      },
    })

  public updateDocument = (
    acronym: string,
    id: string,
    // eslint-disable-next-line @typescript-eslint/ban-types
    fields: object,
    account?: string,
    schema?: string
  ) =>
    this.patch(this.routes.document(acronym, id), fields, {
      metric: 'masterdata-updateDocument',
      params: {
        ...(schema ? { _schema: schema } : null),
        ...(account ? { an: account } : null),
      },
    })

  public searchDocuments = <T>(
    acronym: string,
    fields: string[],
    where: string,
    pagination: PaginationArgs,
    schema?: string,
    sort?: string,
    account?: string
  ) => {
    return this.get<T[]>(this.routes.search(acronym), {
      headers: paginationArgsToHeaders(pagination),
      metric: 'masterdata-searchDocuments',
      params: {
        _fields: generateFieldsArg(fields),
        _where: where,
        _sort: sort,
        ...(schema ? { _schema: schema } : null),
        ...(account ? { an: account } : null),
      },
    })
  }

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
      attachments: (acronym: string, id: string, fields: string) => {
        checkForURLsInStringArguments(acronym, id, fields)

        return `${DATAENTITIES_PREFIX}/${acronym}/documents/${id}/${fields}/attachments`
      },
      document: (acronym: string, id: string) => {
        checkForURLsInStringArguments(acronym, id)

        return `${DATAENTITIES_PREFIX}/${acronym}/documents/${id}`
      },
      documents: (acronym: string) => {
        checkForURLsInStringArguments(acronym)

        return `${DATAENTITIES_PREFIX}/${acronym}/documents`
      },
      schema: (acronym: string, schema: string) => {
        checkForURLsInStringArguments(acronym, schema)

        return `${DATAENTITIES_PREFIX}/${acronym}/schemas/${schema}`
      },
      publicSchema: (acronym: string, schema: string) => {
        checkForURLsInStringArguments(acronym, schema)

        return `${DATAENTITIES_PREFIX}/${acronym}/schemas/${schema}/public`
      },
      search: (acronym: string) => {
        checkForURLsInStringArguments(acronym)

        return `${DATAENTITIES_PREFIX}/${acronym}/search`
      },
    }
  }
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
  return fields.join(',')
}

/**
 * This function throws an error if any of the passed args are an URL.
 * We need to perform this check to protect our servers against possible
 * SSRF attacks.
 *
 * @param {...string[]} args
 */
function checkForURLsInStringArguments(...args: string[]) {
  for (let idx = 0; idx < args.length; idx++) {
    if (validator.isURL(args[idx])) {
      throw new UserInputError('Invalid arguments')
    }
  }
}

interface PaginationArgs {
  page: number
  pageSize: number
}
