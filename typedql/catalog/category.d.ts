import { ID, Int } from '../primitive'

export interface Category {
  cacheId: ID
  href?: string
  slug?: string
  id?: Int
  name?: string
  titleTag?: string
  hasChildren?: boolean
  metaTagDescription?: string
  children?: Category[]
}
