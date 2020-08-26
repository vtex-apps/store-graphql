/**
 * Assembly options related types
 */

interface CompositionItem {
  id: string
  minQuantity: number
  maxQuantity: number
  initialQuantity: number
  priceTable: string
  seller: string
}

interface Composition {
  minQuantity: number
  maxQuantity: number
  items: CompositionItem[]
}

interface AssemblyOption {
  id: string
  name: string
  composition: Composition | null
}

interface CatalogMetadataItem {
  Name: string
  NameComplete: string
  MainImage: string
  BrandName: string
  CategoryId: number
  ProductId: number
  id: string
  seller: string
  assemblyOptions: AssemblyOption[]
}

interface MetadataItem {
  id: string
  name: string
  imageUrl: string
  detailUrl: string
  seller: string
  assemblyOptions: AssemblyOption[]
  skuName: string
  productId: string
  refId: string
  ean: string | null
}
interface AddedItem {
  choiceType: string
  compositionItem: CompositionItem
  extraQuantity: number
  item: OrderFormItem
  normalizedQuantity: number
}

interface RemovedItem {
  initialQuantity: number
  name: string
  removedQuantity: number
}
