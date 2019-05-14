interface ProductsArgs {
  query: string
  category: string
  specificationFilters: string[]
  priceRange: string
  collection: string
  salesChannel: string
  orderBy: string
  from: number
  to: number
  map: string
  hideUnavailableItems: boolean
}

interface Metadata {
  metaTagDescription?: string
  titleTag?: string
}

interface Brand {
  id: string
  name: string
  isActive: boolean
  title?: string
  metaTagDescription?: string
}

interface Category {
  id: string
  name: string
  url: string
  children: Category[]
}

interface FacetsArgs {
  facets: string //deprecated!
  query: string
  map: string
  hideUnavailableItems: boolean
}