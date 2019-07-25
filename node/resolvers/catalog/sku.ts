import { find, head, map, replace, slice } from 'ramda'

import { toSKUIOMessage, toSpecificationIOMessage } from './../../utils/ioMessage'
import { hashMD5 } from './utils'

export const resolvers = {
  SKU: {
    attachments: ({ attachments = [] }: any) => map(
      (attachment: any) => ({
        ...attachment,
        domainValues: JSON.parse(attachment.domainValues),
      }),
      attachments
    ),

    images: ({ images = [] }: any, { quantity }: any) => map(
      (image: any) => ({
        cacheId: image.imageId,
        ...image,
        imageUrl: replace('http://', 'https://', image.imageUrl),
      }),
      quantity > 0 ? slice(0, quantity, images) : images
    ),

    kitItems: ({ kitItems }: any, _: any, { clients: { catalog } }: Context) => !kitItems
      ? []
      : Promise.all(
        kitItems.map(async (kitItem: any) => {
          const products = await catalog.productBySku([kitItem.itemId])
          const { items: skus = [], ...product } = head(products) || {}
          const sku = find(({ itemId }: any) => itemId === kitItem.itemId, skus)
          return { ...kitItem, product, sku }
        })
      ),

    variations: (sku: any) => sku && map(
      (name: string) => ({ name, values: sku[name] }),
      sku.variations || []
    ),

    videos: ({ Videos }: any) => map(
      (video: string) => ({
        videoUrl: video,
      }),
      Videos
    ),

    nameComplete: (
      { nameComplete, itemId }: SKU,
      _: any,
      { clients: { segment } }: Context
    ) => toSKUIOMessage('nameComplete')(segment, nameComplete, itemId),

    skuSpecifications: (
      sku: any,
      _: any,
      { clients: { segment } }: Context
    ) => {
      const { variations } = sku
      let skuSpecifications = new Array() as [skuSpecification]

      (variations || []).forEach(
        (variation: string) => {
          let skuSpecification: skuSpecification = {
            fieldName: toSpecificationIOMessage('fieldName')(segment, variation, hashMD5(variation)), 
            fieldValues: new Array() as [Promise<{ content: string; from: string; id: string; }>]
          };

          (sku[variation] || []).forEach(
            (value: string) => {
              skuSpecification.fieldValues.push(toSpecificationIOMessage(`fieldValue`)(segment, value, hashMD5(value)))
            }
          );

          skuSpecifications.push(skuSpecification)
        },
      )

      return skuSpecifications
    },

    name: (
      { name, itemId }: SKU,
      _: any,
      { clients: { segment } }: Context
    ) => toSKUIOMessage('name')(segment, name, itemId),
  }
}
