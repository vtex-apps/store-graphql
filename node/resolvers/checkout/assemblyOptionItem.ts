import { pathOr } from 'ramda'

import { buildAddedOptionsForItem, buildRemovedOptions } from './attachmentsHelper'

const hasAttachments = (orderForm) => {
  const metadataItems = pathOr([], ['itemMetadata', 'items'], orderForm) as any[]
  if (metadataItems.length === 0) { return false }
  return metadataItems.some(({ assemblyOptions }) => assemblyOptions && assemblyOptions.length > 0)
}

export const resolvers = {
  AssemblyOptionItem: {
    added: ({ item, childs, index, orderForm }) => {
      if (childs.length === 0 || !hasAttachments(orderForm)) {
        return []
      }
      return buildAddedOptionsForItem(orderForm, item, index, childs)
    },
    removed: ({ item, orderForm }) => {
      if (!hasAttachments(orderForm)) {
        return []
      }
      return buildRemovedOptions(item, orderForm)
    },
  }
}
