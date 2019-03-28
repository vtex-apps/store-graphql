import { find, head, map, replace, slice } from 'ramda'

export const resolvers = {
  SKU: {
    attachments: ({attachments = []}: any) => map(
      (attachment: any) => ({
        ...attachment,
        domainValues: JSON.parse(attachment.domainValues),
      }),
      attachments
    ),
    images: ({images = []}: any, {quantity}: any) => map(
      (image: any) => ({
        cacheId: image.imageId,
        ...image,
        imageUrl: replace('http://', 'https://', image.imageUrl),
      }),
      quantity > 0 ? slice(0, quantity, images) : images
    ),
    kitItems: ({kitItems}, _, {dataSources: {catalog}}: Context) => !kitItems
      ? []
      : Promise.all(
          kitItems.map(async kitItem => {
            const products = await catalog.productBySku([kitItem.itemId])
            const { items: skus = [], ...product } = head(products) || {}
            const sku = find(({ itemId }: any) => itemId === kitItem.itemId, skus)
            return { ...kitItem, product, sku }
          })
    ),
    variations: sku => sku && map(
      (name: string) => ({ name, values: sku[name] }),
      sku.variations || []
    ),
  }
}
