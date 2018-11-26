import { find, head, map, replace, slice } from 'ramda'

import { attachmentItemsResolver, attachmentPropertiesResolver } from './attachmentsResolvers'

export const resolvers = {
  Attachment: {
    domainValues: ({ domainValues, sellers }) =>
      JSON.parse(domainValues).map(domainValue => ({ ...domainValue, sellers }))
  },
  DomainValues : {
    items: attachmentItemsResolver,
    properties: attachmentPropertiesResolver,
  },
  SKU: {
    attachments: ({attachments = [], sellers = []}) =>
      map(
        attachment => ({ ...attachment, sellers }),
        attachments
      ),
    images: ({images = []}, {quantity}) => map(
      image => ({
        cacheId: image.imageId,
        ...image,
        imageUrl: replace('http://', 'https://', image.imageUrl),
      }),
      quantity > 0 ? slice(0, quantity, images) : images
    ),
    kitItems: ({kitItems}, _, {dataSources: {catalog}}) => !kitItems
      ? []
      : Promise.all(
          kitItems.map(async kitItem => {
            const products = await catalog.productBySku([kitItem.itemId])
            const { items: skus = [], ...product } = head(products) || {}
            const sku = find(({ itemId }) => itemId === kitItem.itemId, skus)
            return { ...kitItem, product, sku }
          })
    ),
    variations: sku => sku && map(
      (name: string) => ({ name, values: sku[name] }),
      sku.variations || []
    ),
  }
}
