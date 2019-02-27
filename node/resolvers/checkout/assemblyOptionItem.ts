import { values } from 'ramda'

import { buildAddedOptionsForItem, buildRemovedOptions } from './attachmentsHelper'

import { AssemblyOption } from './types'

interface Params {
  item: OrderFormItem
  childs: OrderFormItem[]
  index: number
  assemblyOptionsMap: Record<string, AssemblyOption[]>
  orderForm: any
}

export const resolvers = {
  AssemblyOptionItem: {
    added: ({ item, childs, index, assemblyOptionsMap }: Params) => {
      if (childs.length === 0 || values(assemblyOptionsMap).length === 0) {
        return []
      }
      return buildAddedOptionsForItem(item, index, childs, assemblyOptionsMap)
    },
    parentPrice: ({ item }: Params) => item.sellingPrice * 0.01,
    removed: ({ item, orderForm, assemblyOptionsMap }: Params) => {
      if (values(assemblyOptionsMap).length === 0) {
        return []
      }
      return buildRemovedOptions(item, orderForm, assemblyOptionsMap)
    },
  }
}
