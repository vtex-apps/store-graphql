import { Product } from './product'
import { Float, Int } from '../primitive'

export interface Benefit {
  featured?: boolean
  id?: string
  name?: string
  items?: BenefitItem[]
  teaserType?: string
}

export interface BenefitItem {
  benefitProduct?: Product
  benefitSKUIds?: string[]
  discount?: Float
  minQuantity?: Int
}
