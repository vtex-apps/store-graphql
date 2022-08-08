import {
  all,
  filter,
  find,
  partition,
  propEq,
  omit,
  compose,
  equals,
} from 'ramda'

export const CHOICE_TYPES = {
  MULTIPLE: 'MULTIPLE',
  SINGLE: 'SINGLE',
  TOGGLE: 'TOGGLE',
}

const getNewItemsOnly = (
  previousItems: OrderFormItem[],
  allItems: OrderFormItem[]
) => {
  const idSet = new Set<string>()

  previousItems.forEach((item) => idSet.add(item.uniqueId))

  return allItems.filter((item) => !idSet.has(item.uniqueId))
}

const findRecentlyAddedParent = (
  recentlyAdded: OrderFormItem[],
  id: string,
  assemblyId: string | null
) =>
  recentlyAdded.find(
    (i) => i.id === id && i.parentAssemblyBinding === assemblyId
  )

type OptionItems = Array<Omit<AssemblyOptionInput, 'assemblyId'>>

interface OptionRequestUnit {
  items: OptionItems
  inputValues: Record<string, string | boolean>
}

interface AddOptionsLogicInput {
  checkout: Context['clients']['checkout']
  orderForm: OrderForm
  itemIndex: string | number
  options?: AssemblyOptionInput[]
  oldItems: OrderFormItem[]
}

interface AssemblyOptionBody {
  noSplitItem?: boolean
  composition?: {
    items: Array<{
      id: string
      quantity: number
      seller: string
    }>
  }
  inputValues?: Record<string, string>
}

const addAssemblyBody = (option: OptionRequestUnit) => {
  const body: AssemblyOptionBody = {}

  if (option.items.length > 0) {
    body.noSplitItem = true
    body.composition = {
      items: option.items.map(omit(['options', 'inputValues'])),
    }
  }

  if (option.inputValues) {
    body.noSplitItem = true
    body.inputValues = Object.keys(option.inputValues).reduce<
      Record<string, string>
    >((acc, key) => {
      // Transforming boolean values to string
      acc[key] = `${option.inputValues[key]}`

      return acc
    }, {})
  }

  return body
}

const removeAssemblyBody = (option: OptionRequestUnit) => ({
  composition: {
    items: option.items.map(omit(['quantity', 'options'])),
  },
})

const joinOptionsWithType = (options: AssemblyOptionInput[]) => {
  const result: Record<string, OptionRequestUnit> = {}

  for (const option of options) {
    const { assemblyId, ...rest } = option
    const currentArray = result[assemblyId]?.items || []

    if (rest.id) {
      currentArray.push(rest)
    }

    result[assemblyId] = {
      inputValues: rest.inputValues,
      items: currentArray,
    }
  }

  return result
}

const addOptionsRecursive = async (
  items: OptionItems,
  assemblyId: string,
  orderForm: OrderForm,
  oldItems: OrderFormItem[],
  checkout: Context['clients']['checkout']
) => {
  const recentlyAdded = getNewItemsOnly(oldItems, orderForm.items)
  const results = []

  for (const item of items) {
    const parentItem = findRecentlyAddedParent(
      recentlyAdded,
      item.id!.toString(),
      assemblyId
    )

    const parentIndex =
      parentItem &&
      orderForm.items.findIndex(propEq('uniqueId', parentItem.uniqueId))

    if (parentIndex == null || parentIndex < 0) {
      continue
    }

    results.push(
      addOptionsLogic({
        checkout,
        itemIndex: parentIndex,
        options: item.options,
        orderForm,
        oldItems,
      })
    )
  }

  await Promise.all(results)
}

const addOptionsLogic = async (input: AddOptionsLogicInput) => {
  const { checkout, orderForm, itemIndex, options, oldItems } = input

  if (!options || options.length === 0) {
    return
  }

  const isRemove = (option: AssemblyOptionInput) => option.quantity === 0
  const [toRemove, toAdd] = partition<AssemblyOptionInput>(isRemove, options)
  const joinedToAdd = joinOptionsWithType(toAdd)
  const joinedToRemove = joinOptionsWithType(toRemove)
  const idsToAdd = Object.keys(joinedToAdd)
  const idsToRemove = Object.keys(joinedToRemove)
  let recentOrderForm = orderForm

  for (const assemblyId of idsToRemove) {
    const parsedOptions = joinedToRemove[assemblyId]
    // eslint-disable-next-line no-await-in-loop
    const response = await checkout
      .removeAssemblyOptions(
        orderForm.orderFormId,
        itemIndex,
        assemblyId,
        removeAssemblyBody(parsedOptions)
      )
      // eslint-disable-next-line no-loop-func
      .catch(() => ({ data: recentOrderForm }))

    recentOrderForm = response.data
  }

  for (const assemblyId of idsToAdd) {
    const parsedOptions = joinedToAdd[assemblyId]

    // eslint-disable-next-line no-await-in-loop
    recentOrderForm = await checkout
      .addAssemblyOptions(
        orderForm.orderFormId,
        itemIndex,
        assemblyId,
        addAssemblyBody(parsedOptions)
      )
      // eslint-disable-next-line no-loop-func
      .catch(() => recentOrderForm)
  }

  const results = []

  for (const assemblyId of idsToAdd) {
    const parsedOptions = joinedToAdd[assemblyId]
    const itemsWithRecursiveOptions = parsedOptions.items.filter(
      (arg) => !!arg.options
    )

    if (itemsWithRecursiveOptions.length > 0) {
      results.push(
        addOptionsRecursive(
          itemsWithRecursiveOptions,
          assemblyId,
          recentOrderForm,
          oldItems,
          checkout
        )
      )
    }
  }

  await Promise.all(results)
}

/**
 * Goes through each item being added and check if there are any attachments into that item object.
 * If yes, call appropriate checkout API to add assembly option to that item.
 * @param items items coming from the addItem mutation
 * @param checkout checkout datasource
 * @param orderForm order form object with current items and ID
 */
export const addOptionsForItems = async (
  items: OrderFormItemInput[],
  checkout: Context['clients']['checkout'],
  orderForm: OrderForm,
  oldItems: OrderFormItem[]
) => {
  const recentlyAdded =
    items.length > 0 ? getNewItemsOnly(oldItems, orderForm.items) : []

  const results = []

  for (const item of items) {
    if (!item.options || item.options.length === 0) {
      continue
    }

    const parentItem = findRecentlyAddedParent(
      recentlyAdded,
      item.id!.toString(),
      null
    )

    const parentIndex =
      parentItem &&
      orderForm.items.findIndex(propEq('uniqueId', parentItem.uniqueId))

    if (parentIndex == null || parentIndex < 0) {
      continue
    }

    results.push(
      addOptionsLogic({
        checkout,
        itemIndex: parentIndex,
        options: item.options,
        orderForm,
        oldItems,
      })
    )
  }

  await Promise.all(results)
}

const filterCompositionNull = (assemblyOptions: AssemblyOption[]) =>
  assemblyOptions.filter(({ composition }) => !!composition)

export const buildAssemblyOptionsMap = (orderForm: OrderForm) => {
  const metadataItems = orderForm?.itemMetadata?.items ?? []

  return metadataItems
    .filter(
      ({ assemblyOptions }) => assemblyOptions && assemblyOptions.length > 0
    )
    .reduce((prev, curr) => {
      prev[curr.id] = filterCompositionNull(curr.assemblyOptions)

      return prev
    }, {} as Record<string, AssemblyOption[]>)
}

const isParentOptionSingleChoice = ({ composition }: AssemblyOption) => {
  if (!composition) {
    return false
  }

  return composition.minQuantity === 1 && composition.maxQuantity === 1
}

const isParentOptionToggleChoice = ({ composition }: AssemblyOption) => {
  if (!composition) {
    return false
  }

  return all(propEq('maxQuantity', 1))(composition.items)
}

export const getItemChoiceType = (childAssemblyData?: AssemblyOption) => {
  if (!childAssemblyData) {
    return CHOICE_TYPES.MULTIPLE
  }

  const isSingle = isParentOptionSingleChoice(childAssemblyData!)

  if (isSingle) {
    return CHOICE_TYPES.SINGLE
  }

  const isToggle = isParentOptionToggleChoice(childAssemblyData)

  if (isToggle) {
    return CHOICE_TYPES.TOGGLE
  }

  return CHOICE_TYPES.MULTIPLE
}

const getItemComposition = (
  id: string,
  childAssemblyData?: AssemblyOption
): CompositionItem | undefined => {
  if (!childAssemblyData) {
    return undefined
  }

  const items = childAssemblyData.composition?.items ?? []

  return find<CompositionItem>(propEq('id', id), items)
}

const isSonOfItem = (parentIndex: number) =>
  propEq('parentItemIndex', parentIndex)

export const isParentItem = ({
  parentItemIndex,
  parentAssemblyBinding,
}: OrderFormItem) => parentItemIndex == null && parentAssemblyBinding == null

export const getPositionInOrderForm = (
  { items }: OrderForm,
  { uniqueId }: OrderFormItem
) => items.findIndex((orderItem) => orderItem.uniqueId === uniqueId)

export const buildAddedOptionsForItem = (
  item: OrderFormItem,
  index: number,
  childs: OrderFormItem[],
  assemblyOptionsMap: Record<string, AssemblyOption[]>,
  orderForm: OrderForm
) => {
  const children = filter<OrderFormItem>(isSonOfItem(index), childs)

  return children.map((childItem) => {
    const parentAssemblyOptions = assemblyOptionsMap[item.id]

    const childAssemblyData = find<AssemblyOption>(
      propEq('id', childItem.parentAssemblyBinding)
    )(parentAssemblyOptions)

    const compositionItem = getItemComposition(
      childItem.id,
      childAssemblyData
    ) ?? { initialQuantity: 0 }

    return {
      choiceType: getItemChoiceType(childAssemblyData),
      compositionItem,
      extraQuantity:
        childItem.quantity / item.quantity - compositionItem.initialQuantity,
      item: {
        ...childItem,
        assemblyOptionsData: {
          index: getPositionInOrderForm(orderForm, childItem),
          assemblyOptionsMap,
          childs,
          orderForm,
        },
      },
      normalizedQuantity: childItem.quantity / item.quantity,
    }
  })
}

const findInitialItemOnCart = (initialItem: InitialItem) => (
  cartItem: OrderFormItem
) =>
  cartItem.parentAssemblyBinding === initialItem.parentAssemblyBinding &&
  initialItem.id === cartItem.id

const isInitialItemMissing = (
  parentCartItem: OrderFormItem,
  orderForm: OrderForm
) => (initialItem: InitialItem): RemovedItem | null => {
  const orderFormItem = find(
    findInitialItemOnCart(initialItem),
    orderForm.items
  )

  const selectedQuantity =
    orderFormItem && orderFormItem.quantity / parentCartItem.quantity

  // If we selected more or same as initialQuantity, item is not missing
  if (selectedQuantity && selectedQuantity >= initialItem.initialQuantity) {
    return null
  }

  const metadataItems = orderForm?.itemMetadata?.items
  const metadataItem =
    metadataItems && find(propEq('id', initialItem.id), metadataItems)

  if (!metadataItem) {
    return null
  }

  return {
    initialQuantity: initialItem.initialQuantity,
    name: metadataItem.name,
    removedQuantity: initialItem.initialQuantity - (selectedQuantity ?? 0),
  }
}

interface InitialItem extends CompositionItem {
  parentAssemblyBinding: string
}

const isAssemblyOptionToggle = compose<AssemblyOption, string, boolean>(
  equals(CHOICE_TYPES.TOGGLE),
  getItemChoiceType
)

export const buildRemovedOptions = (
  item: OrderFormItem,
  orderForm: OrderForm,
  assemblyOptionsMap: Record<string, AssemblyOption[]>
): RemovedItem[] => {
  const assemblyOptions = assemblyOptionsMap[item.id]

  if (!assemblyOptions) {
    return []
  }

  // For now, it makes sense it should only work for toggle type of assembly options
  const onlyToggleAssemblies = assemblyOptions.filter(isAssemblyOptionToggle)

  const itemsWithInitials: InitialItem[] = []

  for (const assemblyOption of onlyToggleAssemblies) {
    if (assemblyOption.composition) {
      for (const compItem of assemblyOption.composition.items) {
        if (compItem.initialQuantity > 0) {
          itemsWithInitials.push({
            ...compItem,
            parentAssemblyBinding: assemblyOption.id,
          })
        }
      }
    }
  }

  const removed = itemsWithInitials
    .map(isInitialItemMissing(item, orderForm))
    .filter(Boolean) as RemovedItem[]

  return removed
}
