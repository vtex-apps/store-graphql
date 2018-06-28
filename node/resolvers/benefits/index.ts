import httpResolver from "../httpResolver"
import { headers, withAuthToken } from "../headers"
import paths from '../paths'

/**
 * Default values for Shipping Items
 */
const DEFAULT_QUANTITY = '1'
const DEFAULT_SELLER = '1'

export const queries = {
  /**
   * Benefits Resolver
   * There are two ways to make the request data
   * First of them is passing the graphql args with the items property
   * which is an array of Shipping Items.
   * Second of them is passing just the id of the product itself as a 
   * graphql args.
   */
  benefits: httpResolver({
    data: (args) => {
      if (args.items) {
        return {
          items: args.items
        }
      }
      return {
        items: [
          { 
            id: args.id,
            quantity: DEFAULT_QUANTITY,
            seller: DEFAULT_SELLER
          }
        ]
      }
    },
    merge: (args, data) => data.ratesAndBenefitsData.teaser,
    headers: withAuthToken(headers.json),
    url: paths.benefits,
    method: 'POST'
  })
}