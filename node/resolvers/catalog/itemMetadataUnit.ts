/**
 * This is used because the itemMetadata that comes from the catalog has capitalized Name and MainImage.
 * The itemMetadata that comes from the checkout API has name and imageUrl. This unify the patterns
 */

export const resolvers = {
  ItemMetadataUnit: {
    imageUrl: ({ imageUrl, MainImage }: any) => imageUrl || MainImage,
    skuName: ({ skuName, Name }: any) => skuName || Name,
    name: ({ name, NameComplete }: any) => name || NameComplete,
    productId: ({ productId, ProductId }: any) => productId || ProductId,
  },
}
