import { all, filter, find, partition, path, pathOr, prop, propEq } from 'ramda'

import { AssemblyOption, CompositionItem, MetadataItem, RemovedItem } from './types'

import { CheckoutDataSource } from '../../dataSources/checkout'

export const CHOICE_TYPES = {
  MULTIPLE: 'MULTIPLE',
  SINGLE: 'SINGLE',
  TOGGLE: 'TOGGLE',
}

interface OptionsType {
  id: string
  quantity: number
  assemblyId: string
  seller: string
}

interface OptionRequestParam {
  id: string
  seller: string
}

interface OptionRequestAddParam extends OptionRequestParam {
  quantity: number
}

interface ItemsToAdd {
  id: string
  quantity: number
  seller: string
  index?: number
  options?: OptionsType[]
}

interface AddOptionsLogicInput {
  checkout: CheckoutDataSource,
  orderFormId: string,
  itemIndex: string,
  options?: OptionsType[],
}

const addAssemblyBody = (items: OptionRequestAddParam[]) => ({
  composition: {
    items,
  },
  noSplitItem: true,
})

const removeAssemblyBody = (items: OptionRequestAddParam[]) => ({
  composition: {
    items: removeQuantity(items),
  },
})

const removeQuantity = (options: OptionRequestAddParam[]): OptionRequestParam[] => options.map(({ seller, id }) => ({ seller, id }))

const joinOptionsWithType = (options: OptionsType[]) => {
  return options.reduce<{ [key: string]: OptionRequestAddParam[]}>((prev, curr) => {
    const { assemblyId, ...rest } = curr
    return {
      ...prev,
      [assemblyId]: [...(prev[assemblyId] || []), rest]
    }
  }, {})
}

const addOptionsLogic = async (input: AddOptionsLogicInput) => {
  const { checkout, orderFormId, itemIndex, options } = input
  if (!options || options.length === 0) { return }
  const isRemove = (option) => option.quantity === 0
  const [toRemove, toAdd] = partition<OptionsType>(isRemove, options)
  const joinedToAdd = joinOptionsWithType(toAdd)
  const joinedToRemove = joinOptionsWithType(toRemove)
  for (const [assemblyId, parsedOptions] of Object.entries(joinedToAdd)) {
    await checkout.addAssemblyOptions(orderFormId, itemIndex, assemblyId, addAssemblyBody(parsedOptions)).catch(() => null)
  }
  for (const [assemblyId, parsedOptions] of Object.entries(joinedToRemove)) {
    await checkout.removeAssemblyOptions(orderFormId, itemIndex, assemblyId, removeAssemblyBody(parsedOptions)).catch(() => null)
  }
}

/**
 * Goes through each item being added and check if there are any attachments into that item object.
 * If yes, call appropriate checkout API to add assembly option to that item.
 * @param items items coming from the addItem mutation
 * @param checkout checkout datasource
 * @param orderForm order form object with current items and ID
 */

export const addOptionsForItems = async (
  items: ItemsToAdd[],
  checkout: CheckoutDataSource,
  orderForm: any) => {
  for (const item of items) {
    if (!item.options || item.options.length === 0) { continue }
    const parentIndex = orderForm.items.findIndex(cartItem => cartItem.id.toString() === item.id.toString())
    if (parentIndex < 0) { continue }
    await addOptionsLogic({
      checkout, 
      itemIndex: parentIndex, 
      options: item.options,
      orderFormId: orderForm.orderFormId,
    })
  }
}

export const buildAssemblyOptionsMap = (orderForm: any) => {
  const metadataItems = pathOr([], ['itemMetadata', 'items'], orderForm) as MetadataItem[]
  return metadataItems
         .filter(({ assemblyOptions }) => assemblyOptions && assemblyOptions.length > 0)
         .reduce((prev, curr) => ({ ...prev, [curr.id]: curr.assemblyOptions }) , {})
}

const isParentOptionSingleChoice = ({composition: { minQuantity, maxQuantity }}: AssemblyOption) =>
  minQuantity === 1 && maxQuantity === 1

const isParentOptionToggleChoice = ({ composition: { items }}: AssemblyOption) => all(propEq('maxQuantity', 1))(items)

const getItemChoiceType = (childAssemblyData: AssemblyOption) => {
  if (!childAssemblyData) { return CHOICE_TYPES.MULTIPLE }
  const isSingle = isParentOptionSingleChoice(childAssemblyData)
  if (isSingle) { return CHOICE_TYPES.SINGLE }
  const isToggle = isParentOptionToggleChoice(childAssemblyData)
  if (isToggle) { return CHOICE_TYPES.TOGGLE }

  return CHOICE_TYPES.MULTIPLE
}

const getItemComposition = (childItem: OrderFormItem, childAssemblyData: AssemblyOption): CompositionItem | null => {
  if (!childAssemblyData) { return null }
  return find<CompositionItem>(propEq('id', childItem.id))(childAssemblyData.composition.items)
}

const isSonOfItem = (parentIndex: number) => propEq('parentItemIndex', parentIndex)

export const isParentItem = ({ parentItemIndex, parentAssemblyBinding }: OrderFormItem) => 
  parentItemIndex == null && parentAssemblyBinding == null

export const buildAddedOptionsForItem = (
  item: OrderFormItem,
  index: number,
  childs: OrderFormItem[], 
  assemblyOptionsMap: Record<string, AssemblyOption[]>) => {
  const children = filter<OrderFormItem>(isSonOfItem(index), childs)
  return children.map(childItem => {
    const parentAssemblyOptions = assemblyOptionsMap[item.id]
    const childAssemblyData = find<AssemblyOption>(propEq('id', childItem.parentAssemblyBinding))(parentAssemblyOptions)
    const compositionItem = getItemComposition(childItem, childAssemblyData) || { initialQuantity: 0 }
    return {
      choiceType: getItemChoiceType(childAssemblyData),
      compositionItem,
      extraQuantity: childItem.quantity / item.quantity - compositionItem.initialQuantity,
      item: childItem,
      normalizedQuantity: childItem.quantity / item.quantity,
    }
  })
}

const findInitialItemOnCart = (initialItem: InitialItem) => 
                              (cartItem: OrderFormItem) => 
                                cartItem.parentAssemblyBinding === initialItem.parentAssemblyBinding &&
                                initialItem.id === cartItem.id

const isInitialItemMissing = (parentCartItem: OrderFormItem, orderForm: any) => 
                             (initialItem: InitialItem): RemovedItem | null => {
  const orderFormItem = find(findInitialItemOnCart(initialItem), orderForm.items)
  const selectedQuantity = orderFormItem && orderFormItem.quantity / parentCartItem.quantity

  // If we selected more or same as initialQuantity, item is not missing
  if (selectedQuantity && selectedQuantity >= initialItem.initialQuantity) {
    return null
  }

  return {
    initialQuantity: initialItem.initialQuantity,
    name: prop('name', find(propEq('id', initialItem.id), path(['itemMetadata', 'items'], orderForm))),
    removedQuantity: initialItem.initialQuantity - (selectedQuantity || 0),
  }
}

interface InitialItem extends CompositionItem {
  parentAssemblyBinding: string
}

export const buildRemovedOptions = (
  item: OrderFormItem,
  orderForm: any,
  assemblyOptionsMap: Record<string, AssemblyOption[]>): RemovedItem[] => {
  const assemblyOptions = assemblyOptionsMap[item.id]
  if (!assemblyOptions) { return [] }
  const itemsWithInitials: InitialItem[] = []
  assemblyOptions.map(assemblyOption=> {
    assemblyOption.composition.items.map(compItem => {
      if (compItem.initialQuantity > 0) {
        itemsWithInitials.push({ ...compItem, parentAssemblyBinding: assemblyOption.id })
      }
    })
  })

  const removed = itemsWithInitials.map(isInitialItemMissing(item, orderForm)).filter(Boolean)
  return removed
}
