interface SearchArgs {
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
  filledFields: string
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
  hasChildren: boolean
  children: Category[]
  MetaTagDescription: string
  Title: string
}

interface FacetsArgs {
  facets: string //deprecated!
  query: string
  map: string
  hideUnavailableItems: boolean
}

interface Product {
  productId: string
  productName: string
  brand: string
  brandId: number
  linkText: string
  productReference: string
  categoryId: string
  productTitle: string
  metaTagDescription: string
  clusterHighlights: Record<string, string>
  productClusters: Record<string, string>
  searchableClusters: Record<string, string>
  categories: string[]
  categoriesIds: string[]
  link: string
  description: string
  items: any[]
}
