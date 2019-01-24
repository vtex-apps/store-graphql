import { ID } from '../primitive'

export interface Document {
  /* id is used as cacheId */
  cacheId?: ID
  id?: string
  fields?: Field[]
}

export interface Field {
  key?: string
  value?: string
}

export interface DocumentResponse {
  /* documentId is used as cacheId */
  cacheId?: ID
  id?: string
  href?: string
  documentId?: string
}

export interface AttachmentResponse {
  filename?: string
  mimetype?: string
}

/**
 * @graphql input
 */
export interface FieldInput {
  key?: string
  value?: string
}

/**
 * @graphql input
 */
export interface DocumentInput {
  fields?: FieldInput[]
}
