import { partition } from 'ramda'

import { CheckoutDataSource } from '../../dataSources/checkout'
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
