import { find, head, map, replace, slice } from 'ramda'

interface fixedPriceInputs {
  itemId: String, 
  sellerId: String, 
  measurementUnit: String, 
  unitMultiplier: String
}

const fetchFixedPrices = async (
  {itemId, sellerId, measurementUnit, unitMultiplier}: fixedPriceInputs, 
  { dataSources: { pricing, ratesAndBenefits } }) => {

  try {
    var fixedPrices = await pricing.fixedPrices(itemId)
    
    if (!fixedPrices || !fixedPrices.length) {
      return []
    }
    
    let ratesAndBenefitsItems = await ratesAndBenefits.calculateDiscountsAndTaxes(
      {
        isShoppingCart: false,
        origin: 'Marketplace',
        items: pricing.map(fixedPrice => ({
          id: itemId,
          measurementUnit: measurementUnit,
          unitMultiplier: unitMultiplier,
          sellerId: sellerId,
          quantity: fixedPrice.minQuantity,
        }))
      }
    )

    return ratesAndBenefitsItems && ratesAndBenefitsItems.items
    ? ratesAndBenefitsItems.items
    : []

  }catch(e) {
    // TODO: Log the error
    console.log(e)
  }
}

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
    kitItems: ({kitItems}, _, {dataSources: {catalog}}) => !kitItems
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
    sellers: ({ itemId, sellers, measurementUnit, unitMultiplier }, _, { dataSources: { pricing, ratesAndBenefits } }) => {
      return sellers.map(async seller => ({
        ...seller, 
        ...{ fixedPrices: await fetchFixedPrices({ itemId: itemId, sellerId: seller.sellerId, measurementUnit: measurementUnit, unitMultiplier: unitMultiplier }, { dataSources: { pricing, ratesAndBenefits }})}
      }))
    }
  }
}
