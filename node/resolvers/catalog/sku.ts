import axios from 'axios'
import { ColossusContext } from 'colossus'
import { find, head, map, replace } from 'ramda'
import { withAuthToken } from '../headers'
import paths from '../paths'

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
    kitItems: ({kitItems}, _, { vtex: ioContext }: ColossusContext) => !kitItems
      ? []
      : Promise.all(
          kitItems.map(async kitItem => {
            const url = paths.productBySku(ioContext.account, {
              skuIds: [kitItem.itemId],
            })
            const { data: products } = await axios.get(url, {
              headers: withAuthToken()(ioContext),
            })
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
