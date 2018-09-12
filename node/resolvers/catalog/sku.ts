import { find, head, map, replace } from 'ramda'

export const resolvers = {
  SKU: {
    attachments: ({attachments = []}) => map(
      attachment => ({
        ...attachment,
        domainValues: JSON.parse(attachment.domainValues),
      }),
      attachments
    ),
    images: ({images = []}) => map(
      image => ({
        ...image,
        imageUrl: replace('http://', 'https://', image.imageUrl),
      }),
      images
    ),
    kitItems: ({kitItems}, _, {dataSources: {catalog}}) => !kitItems
      ? []
      : Promise.all(
          kitItems.map(async kitItem => {
            const products = await catalog.productBySku([kitItem.itemId])
            const { items: skus, ...product } = head(products) || {}
            const sku = find(
              ({ itemId }) => itemId === kitItem.itemId,
              skus || []
            )
            return { ...kitItem, product, sku }
          })
    ),
    variations: sku => sku && map(
      (name: string) => ({ name, values: sku[name] }),
      sku.variations || []
    ),
  }
}
