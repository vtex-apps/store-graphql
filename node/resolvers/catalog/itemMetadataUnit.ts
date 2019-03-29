
/** 
 * This is used because the itemMetadata that comes from the catalog has capitalized Name and MainImage.
 * The itemMetadata that comes from the checkout API has name and imageUrl. This unify the patterns
 */

export const resolvers = {
  ItemMetadataUnit: {
    imageUrl: ({ imageUrl, MainImage }: any) => imageUrl || MainImage,
    name: ({ name, Name }: any) => name || Name,
    productId: ({ productId, ProductId }: any) => productId || ProductId
  },
} 
