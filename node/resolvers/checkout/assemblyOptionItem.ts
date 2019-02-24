import { buildAddedOptionsForItem, buildRemovedOptions, isSonOfItem } from './attachmentsHelper'

const itemTotalPrice = ({ sellingPrice, quantity }) => sellingPrice / 100 * quantity

export const resolvers = {
  AssemblyOptionItem: {
    added: ({ item, childs, index, orderForm, hasAttachments }) => {
      if (childs.length === 0 || !hasAttachments) {
        return []
      }
      return buildAddedOptionsForItem(orderForm, item, index, childs)
    },
    parentPrice: ({ item }) => item.sellingPrice * 0.01,
    removed: ({ item, orderForm, hasAttachments }) => {
      if (!hasAttachments) {
        return []
      }
      return buildRemovedOptions(item, orderForm)
    },
  }
}
