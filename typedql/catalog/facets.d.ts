import { Int } from '../primitive'

export interface Facets {
  Departments?: Facet[]
  Brands?: Facet[]
  SpecificationFilters?: Filter[]
  CategoriesTrees?: Facet[]
  PriceRanges?: Facet[]
}

export interface Facet {
  Id?: Int
  Name: string
  Quantity: Int
  Link: string
  Slug?: string
  Children?: Facet[]
}

export interface Filter {
  name?: string
  facets?: Facet[]
}
