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

interface MetadataItem {
  id: string
  name: string
  imageUrl: string
  detailUrl: string
  seller: string
  assemblyOptions: AssemblyOption[]
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
