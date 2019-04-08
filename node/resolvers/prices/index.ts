import { flatten, path } from 'ramda'
import { queries as checkoutQueries } from '../checkout'
import { acronym, fields, schema, page, pageSize } from './utils'

export const fieldResolvers = {
  PriceBreak: {
    itemId: (item: any, _: any) => path(["id"], item),
    minQuantity: (item: any, _: any) => path(["quantity"], item),
    maxQuantity: (item: any, _: any) => path(["maxQuantity"], item),
  }
}

export const queries = {

  priceBreaks: async (_: any, args: any, ctx: any) => {
    const { dataSources: { document } } = ctx

    const where = `itemId=${args.itemId}`
    const quantityBreaks = await document.searchDocumentsWithSchema(acronym, fields, where, schema, { page: page, pageSize: pageSize })

    if (!quantityBreaks || !quantityBreaks.length) {
      return null
    }

    const quantityPriceRanges = await Promise.all(quantityBreaks.map(async (quantityBreak: any) => {
      const requestBody = {
        "items": [
          {
            "id": args.itemId,
            "quantity": quantityBreak.minQuantity,
            "seller": args.sellerId
          }
        ]
      }
      const shippingSimulationData = await checkoutQueries.shipping(_, requestBody, ctx)
      const responseItems = path(['items'], shippingSimulationData) || [];
      return (responseItems as []).map((priceBreak: any) =>
        ({ ...priceBreak, ...{ "maxQuantity": quantityBreak.maxQuantity } }))
    }))

    return flatten(quantityPriceRanges)
  },
}
