
/** 
 * This is used because the itemMetadata that comes from the catalog has capitalized Name and MainImage.
 * The itemMetadata that comes from the checkout API has name and imageUrl. This unify the patterns
 */

export const resolvers = {
  ItemMetadataUnit: {
    imageUrl: ({ imageUrl, MainImage }) => {
      return imageUrl || MainImage
    },
    name: ({ name, Name }) => {
      return name || Name
    }
  },
}