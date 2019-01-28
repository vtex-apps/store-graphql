interface OptionsType {
  id: string,
  quantity: number,
  type: string,
}

interface AddOptionsLogicInput {
  checkout: any,
  orderFormId: string,
  itemIndex: string,
  assemblyPreffix?: string,
  options?: OptionsType[],
}

const addOptionsLogic = async (input: AddOptionsLogicInput) => {
  const { checkout, orderFormId, itemIndex, assemblyPreffix, options } = input
  if (!assemblyPreffix || !options || options.length === 0) { return }

  const types = options.reduce<{ [key: string]: Array<{ quantity: number, id: string }>}>((prev, curr) => {
    const { type, ...rest } = curr
    return {
      ...prev,
      [type]: [...(prev[type] || []), rest]
    }
  }, {})
  const body = (items) => ({
    composition: {
      items,
    },
    noSplitItem: true,
  })
  const entries = Object.entries(types)
  for (const [type, parsedOptions] of entries) {
    try {
      await checkout.addAssemblyOptions(orderFormId, itemIndex, `${assemblyPreffix}_${type}`, body(parsedOptions))
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
      assemblyPreffix: item.assemblyOptionPreffix, 
      checkout, 
      itemIndex: parentIndex, 
      options: item.options,
      orderFormId: orderForm.orderFormId,
    })
  }
}
