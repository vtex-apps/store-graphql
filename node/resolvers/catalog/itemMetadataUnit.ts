
/** 
 * This is used because the itemMetadata that comes from the catalog has capitalized Name and ImageUrl.
 * The itemMetadata that comes from the checkout API has name and imageUrl. This unify the patters
 */

export const resolvers = {
  ItemMetadataUnit: {
    imageUrl: ({ imageUrl, ImageUrl }) => {
      return imageUrl || ImageUrl
    },
    name: ({ name, Name }) => {
      return name || Name
    }
  },
}