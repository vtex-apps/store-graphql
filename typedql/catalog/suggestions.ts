import { ID } from '../primitive'

export interface Suggestions {
  cacheId: ID
  itemsReturned: Items[]
}

export interface Items {
  thumb?: string
  name?: string
  href?: string
  criteria?: string
  slug?: string
}
