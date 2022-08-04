type AnyMetadataItem = Partial<MetadataItem & CatalogMetadataItem>

/**
 * This is used because the itemMetadata that comes from the catalog has capitalized Name and MainImage.
 * The itemMetadata that comes from the checkout API has name and imageUrl. This unify the patterns
 */

export const resolvers = {
  ItemMetadataUnit: {
    imageUrl: ({ imageUrl, MainImage }: AnyMetadataItem) =>
      imageUrl ?? MainImage,
    skuName: ({ skuName, Name }: AnyMetadataItem) => skuName ?? Name,
    name: ({ name, NameComplete }: AnyMetadataItem) => name ?? NameComplete,
    productId: ({ productId, ProductId }: AnyMetadataItem) =>
      productId ?? ProductId,
  },
}
