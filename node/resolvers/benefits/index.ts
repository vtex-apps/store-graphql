import { flatten, indexOf, path } from 'ramda'

import { queries as checkoutQueries } from '../checkout'

const SKU_SEPARATOR = ','
const CATALOG = 'Catalog'
const DEFAULT_SELLER = '1'
const DEFAULT_QUANTITY = '1'

export const fieldResolvers = {
  Benefit: {
    items: async (benefit: any, _: any, { clients: { catalog } }: Context) => {
      const { teaserType, conditions, effects } = benefit

      if (teaserType !== CATALOG) {
        return
      }

      const {
        parameters: conditionsParameters,
        minimumQuantity = parseInt(DEFAULT_QUANTITY, 10),
      } = conditions

      const { parameters: effectsParameters } = effects

      const items = await Promise.all(
        conditionsParameters.map(
          async (conditionsParameter: any, index: any) => {
            const skuIds: string[] = conditionsParameter.value.split(
              SKU_SEPARATOR
            )

            const discount = effectsParameters[index].value
            const products = await catalog.productBySku(skuIds)

            return products.map((product: any) => {
              const benefitSKUIds: any = []

              product.items.forEach((item: any) => {
                if (indexOf(item.itemId, skuIds) > -1) {
                  benefitSKUIds.push(item.itemId)
                }
              })

              return {
                benefitProduct: product,
                benefitSKUIds,
                discount,
                minQuantity: minimumQuantity,
              }
            })
          }
        )
      )

      return flatten(items)
    },
  },
}

export const queries = {
  /**
   * There are two ways to make the request data
   * First of them is passing the graphql args with the items property which is an array of Shipping Items.
   * Second is passing just the id of the product itself as a graphql argument.
   */
  benefits: async (_: any, args: any, config: any) => {
    const requestBody = {
      items: args.items
        ? args.items
        : [
            {
              id: args.id,
              quantity: DEFAULT_QUANTITY,
              seller: DEFAULT_SELLER,
            },
          ],
    }

    const benefitsData = await checkoutQueries.shipping(_, requestBody, config)

    return path(['ratesAndBenefitsData', 'teaser'], benefitsData) || []
  },
}
