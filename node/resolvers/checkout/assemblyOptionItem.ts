import { values } from 'ramda'

import {
  buildAddedOptionsForItem,
  buildRemovedOptions,
} from './attachmentsHelper'

interface Params {
  item: OrderFormItem
  childs: OrderFormItem[]
  index: number
  assemblyOptionsMap: Record<string, AssemblyOption[]>
  orderForm: OrderForm
}

export const resolvers = {
  AssemblyOptionItem: {
    added: ({ item, childs, index, assemblyOptionsMap, orderForm }: Params) => {
      if (childs.length === 0 || values(assemblyOptionsMap).length === 0) {
        return []
      }

      return buildAddedOptionsForItem(
        item,
        index,
        childs,
        assemblyOptionsMap,
        orderForm
      )
    },
    parentPrice: ({ item }: Params) => item.sellingPrice * 0.01,
    removed: ({ item, orderForm, assemblyOptionsMap }: Params) => {
      if (values(assemblyOptionsMap).length === 0) {
        return []
      }

      return buildRemovedOptions(item, orderForm, assemblyOptionsMap)
    },
  },
}
