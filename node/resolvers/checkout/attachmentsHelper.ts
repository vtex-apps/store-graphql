interface OptionsType {
  id: string,
  quantity: number,
  assemblyId: string,
}

interface AddOptionsLogicInput {
  checkout: any,
  orderFormId: string,
  itemIndex: string,
  options?: OptionsType[],
}

const addOptionsLogic = async (input: AddOptionsLogicInput) => {
  const { checkout, orderFormId, itemIndex, options } = input
  if (!options || options.length === 0) { return }

  const types = options.reduce<{ [key: string]: Array<{ quantity: number, id: string }>}>((prev, curr) => {
    const { assemblyId, ...rest } = curr
    return {
      ...prev,
      [assemblyId]: [...(prev[assemblyId] || []), rest]
    }
  }, {})
  const body = (items) => ({
    composition: {
      items,
    },
    noSplitItem: true,
  })
  const entries = Object.entries(types)
  for (const [assemblyId, parsedOptions] of entries) {
    try {
      await checkout.addAssemblyOptions(orderFormId, itemIndex, assemblyId, body(parsedOptions))
    } catch (err) {
      // go on to next api call if one fails
    }
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
