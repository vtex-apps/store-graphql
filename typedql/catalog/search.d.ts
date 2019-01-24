import { Int } from '../primitive'
import { Facets } from './facets'
import { Product } from './product'

export interface Search {
  facets?: Facets
  products?: Product[]
  recordsFiltered?: Int
  titleTag?: string
  metaTagDescription?: string
}
