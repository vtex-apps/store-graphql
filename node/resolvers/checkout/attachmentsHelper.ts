import { all, filter, find, partition, path, pathOr, prop, propEq } from 'ramda'

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

export const addOptionsForItems = async (items, checkout, orderForm) => {
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

const findParentAssemblyOption = (item: OrderFormItem, orderForm) => {
  const { parentItemIndex, parentAssemblyBinding } = item
  if (!orderForm.itemMetadata || isParentItem(item)) { return null }
  const parentId = orderForm.items[parentItemIndex].id

  const parentMetadata = find(propEq('id', parentId))(orderForm.itemMetadata.items) as any
  if (!parentMetadata) { return null }

  return find(propEq('id', parentAssemblyBinding))(parentMetadata.assemblyOptions)
}

const isParentOptionSingleChoice = ({composition: { minQuantity, maxQuantity }}) =>
  minQuantity === 1 && maxQuantity === 1

const isParentOptionToggleChoice = ({ composition: { items }}) => all(propEq('maxQuantity', 1))(items)

const getItemChoiceType = (parentAssemblyOptions) => {
  if (!parentAssemblyOptions) { return CHOICE_TYPES.MULTIPLE }
  const isSingle = isParentOptionSingleChoice(parentAssemblyOptions)
  if (isSingle) { return CHOICE_TYPES.SINGLE }
  const isToggle = isParentOptionToggleChoice(parentAssemblyOptions)
  if (isToggle) { return CHOICE_TYPES.TOGGLE }

  return CHOICE_TYPES.MULTIPLE
}

const getItemComposition = (childItem: OrderFormItem, parentAssemblyOptions) => {
  if (!parentAssemblyOptions) { return {} }
  return find(propEq('id', childItem.id))(parentAssemblyOptions.composition.items) || {}
}

const isSonOfItem = (parentIndex: number) => propEq('parentItemIndex', parentIndex)

export const isParentItem = ({ parentItemIndex, parentAssemblyBinding }: OrderFormItem) => 
  parentItemIndex == null && parentAssemblyBinding == null

export const buildAddedOptionsForItem = (orderForm, item: OrderFormItem, index: number, childs: any[]) => {
  const children = filter(isSonOfItem(index), childs) as OrderFormItem[]
  return children.map(childItem => {
    const parentAssemblyOptions = findParentAssemblyOption(childItem, orderForm)
    const compositionItem = getItemComposition(childItem, parentAssemblyOptions) as any
    return {
      choiceType: getItemChoiceType(parentAssemblyOptions),
      compositionItem,
      extraQuantity: childItem.quantity / item.quantity - compositionItem.initialQuantity,
      item: childItem,
      normalizedQuantity: childItem.quantity / item.quantity,
    }
  })
}

const findInitialItemOnCart = (initialItem) => (cartItem) => cartItem.parentAssemblyBinding === initialItem.parentAssemblyBinding &&
                                                             initialItem.id === cartItem.id

const isInitialItemMissing = (parentCartItem, orderForm) => (initialItem) => {
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


export const buildRemovedOptions = (item, orderForm) => {
  const assemblyOptions = prop('assemblyOptions', find(propEq('id', item.id), pathOr([], ['itemMetadata', 'items'], orderForm) as [])) as any
  if (!assemblyOptions) { return [] }
  const itemsWithInitials = []
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
