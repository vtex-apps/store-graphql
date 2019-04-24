/**  
 * Assembly options related types
 */

export interface CompositionItem {
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

export interface AssemblyOption {
  id: string
  name: string
  composition: Composition | null
}

export interface MetadataItem {
  id: string
  name: string
  imageUrl: string
  detailUrl: string
  seller: string
  assemblyOptions: AssemblyOption[]
}
export interface AddedItem {
  choiceType: string
  compositionItem: CompositionItem
  extraQuantity: number
  item: OrderFormItem
  normalizedQuantity: number
}

export interface RemovedItem {
  initialQuantity: number
  name: string
  removedQuantity: number
}