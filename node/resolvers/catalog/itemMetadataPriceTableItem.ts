import { isEmpty, path } from 'ramda'
import { getItemChoiceType, CHOICE_TYPES } from '../checkout/attachmentsHelper'

interface Params {
  compositionItem: CompositionItem
  simulationPayload: {
    marketingData: Record<string, string>
    countryCode: string
  }
  items: MetadataItem[]
  father: MetadataItem
  assemblyOption: AssemblyOption
}

const getSimulationPayloadItemsForSingleFromTree = (
  father: MetadataItem,
  childId: string,
  seller: string,
  parentAssemblyBinding: string
) => {
  return [
    { id: father.id, quantity: 1, seller: father.seller },
    {
      id: childId,
      seller,
      quantity: 1,
      parentItemIndex: 0,
      parentAssemblyBinding,
    },
  ]
}

const getSimulationPayloadItemsForToggleFromTree = (
  father: MetadataItem,
  childId: string,
  seller: string,
  assemblyOption: AssemblyOption,
  fatherBasicTree: PayloadItem[]
) => {
  const fatherPayloadItem = {
    id: father.id,
    quantity: 1,
    seller: father.seller,
  }
  const basicChildItem = {
    id: childId,
    seller,
    quantity: 1,
    parentItemIndex: 0,
    parentAssemblyBinding: assemblyOption.id,
  }
  const siblings = fatherBasicTree.filter(
    ({ parentAssemblyBinding }) => parentAssemblyBinding === assemblyOption.id
  )
  const siblingCount = siblings.length
  if (siblingCount < assemblyOption.composition!.maxQuantity) {
    return [fatherPayloadItem, basicChildItem]
  }

  const brotherToBeRemoved = siblings.find(item => {
    const brotherComposition = assemblyOption.composition!.items.find(
      comp => comp.id === item.id
    )
    return brotherComposition!.minQuantity === 0
  })
  if (!brotherToBeRemoved) {
    return []
  }
  const withoutBrother = fatherBasicTree.filter(
    ({ id, parentAssemblyBinding }) =>
      id !== brotherToBeRemoved.id &&
      parentAssemblyBinding !== brotherToBeRemoved.parentAssemblyBinding
  )
  return [fatherPayloadItem, ...withoutBrother, basicChildItem]
}

const getSimulationPayloadItemsForMultipleFromTree = (
  father: MetadataItem,
  assemblyOption: AssemblyOption,
  fatherBasicTree: PayloadItem[],
  childCompositionItem: CompositionItem
) => {
  const fatherPayloadItem = {
    id: father.id,
    quantity: 1,
    seller: father.seller,
  }
  const basicItemQuantity = childCompositionItem.minQuantity || 1
  const basicChildItem = {
    id: childCompositionItem.id,
    seller: childCompositionItem.seller,
    quantity: basicItemQuantity,
    parentItemIndex: 0,
    parentAssemblyBinding: assemblyOption.id,
  }
  const siblings = fatherBasicTree.filter(
    ({ parentAssemblyBinding, parentItemIndex }) =>
      parentAssemblyBinding === assemblyOption.id && parentItemIndex === 0
  )

  const siblingCount = siblings.reduce((sum, sib) => sum + sib.quantity, 0)
  const siblingsAllowed = assemblyOption.composition!.maxQuantity - siblingCount
  if (basicItemQuantity <= siblingsAllowed) {
    return [fatherPayloadItem, ...siblings, basicChildItem]
  }

  let currentSiblingCount = siblingCount
  for (const brother of siblings) {
    const brotherComposition = assemblyOption.composition!.items.find(
      comp => comp.id === brother.id
    )
    const oldBrotherQuantity = brother.quantity
    brother.quantity = brotherComposition!.minQuantity
    currentSiblingCount -= oldBrotherQuantity - brotherComposition!.minQuantity
    const currentSiblingsAllowed =
      assemblyOption.composition!.maxQuantity - currentSiblingCount
    if (currentSiblingsAllowed >= basicItemQuantity) {
      break
    }
  }

  const nonEmptySiblings = siblings.filter(({ quantity }) => quantity > 0)
  return [fatherPayloadItem, ...nonEmptySiblings, basicChildItem]
}

const simulateAndGetPrice = async (
  payload: SimulationPayload,
  checkout: Context['clients']['checkout'],
  itemId: string,
  assemblyId: string
) => {
  const simulation = await checkout.simulation(payload)
  const childInTree = simulation.items.find(
    item => itemId === item.id && assemblyId === item.parentAssemblyBinding
  )
  return childInTree ? childInTree.sellingPrice : 0
}

const getSimulationPayloadItems = (
  assemblyOption: AssemblyOption,
  compositionItem: CompositionItem,
  father: MetadataItem,
  fatherBasicTree: PayloadItem[]
) => {
  const assemblyType = getItemChoiceType(assemblyOption)

  if (assemblyType === CHOICE_TYPES.SINGLE) {
    return getSimulationPayloadItemsForSingleFromTree(
      father,
      compositionItem.id,
      compositionItem.seller,
      assemblyOption.id
    )
  }
  if (assemblyType === CHOICE_TYPES.TOGGLE) {
    return getSimulationPayloadItemsForToggleFromTree(
      father,
      compositionItem.id,
      compositionItem.seller,
      assemblyOption,
      fatherBasicTree
    )
  }
  return getSimulationPayloadItemsForMultipleFromTree(
    father,
    assemblyOption,
    fatherBasicTree,
    compositionItem
  )
}

export const resolvers = {
  PriceTableItem: {
    assemblyId: path(['assemblyOption', 'id']),
    id: path(['compositionItem', 'id']),
    price: async (
      { father, simulationPayload, assemblyOption, compositionItem }: Params,
      _: any,
      { clients: { checkout } }: Context
    ) => {
      const { id, priceTable } = compositionItem
      const { marketingData, countryCode } = simulationPayload
      const payload = {
        country: countryCode,
        isCheckedIn: false,
        priceTables: [priceTable],
        ...(isEmpty(marketingData) ? {} : { marketingData }),
      }

      const fatherBasicTree = [
        { id: father.id, seller: father.seller, quantity: 1 },
      ] as PayloadItem[]

      for (const fatherAssemblyOption of father.assemblyOptions) {
        const assemblyId = fatherAssemblyOption.id
        if (!fatherAssemblyOption.composition) {
          continue
        }
        for (const compItem of fatherAssemblyOption.composition!.items) {
          if (compItem.initialQuantity > 0) {
            fatherBasicTree.push({
              id: compItem.id,
              quantity: compItem.initialQuantity,
              seller: compItem.seller,
              parentItemIndex: 0,
              parentAssemblyBinding: assemblyId,
            })
          }
        }
      }

      const itemInTree = fatherBasicTree.find(
        item =>
          id === item.id && assemblyOption.id === item.parentAssemblyBinding
      )
      if (itemInTree) {
        return simulateAndGetPrice(
          { ...payload, items: fatherBasicTree },
          checkout,
          id,
          assemblyOption.id
        )
      }
      const newSimulationPayloadItems = getSimulationPayloadItems(
        assemblyOption,
        compositionItem,
        father,
        fatherBasicTree
      )
      return simulateAndGetPrice(
        { ...payload, items: newSimulationPayloadItems },
        checkout,
        id,
        assemblyOption.id
      )
    },
  },
}
