import http from 'axios'
import paths from '../paths'

/**
 * Default values for Shipping Items
 */
const DEFAULT_QUANTITY = '1'
const DEFAULT_SELLER = '1'

export const queries = {
  /**
   * There are two ways to make the request data
   * First of them is passing the graphql args with the items property which is an array of Shipping Items. 
   * Second is passing just the id of the product itself as a graphql argument.
   */

  benefits: async (_, args, { vtex: ioContext }) => {
    let body
    if (args.items) {
      body = { items: args.items }
    } else {
      body = {
        items: [
          { 
            id: args.id,
            quantity: DEFAULT_QUANTITY,
            seller: DEFAULT_SELLER
          }
        ]
      }
    }
    const headers = {
      Accept: 'application/vnd.vtex.ds.v10+json',
      Authorization: ioContext.authToken,
      ['Content-Type']: 'application/json',
    }
    const url = paths.shipping(ioContext.account)
    const { data } = await http.post(url, body, { headers })
    if (data.ratesAndBenefitsData.teaser) {
      const benefits = data.ratesAndBenefitsData.teaser
      benefits.map(benefit => {
        const parameters = benefit.conditions.parameters
        parameters.map(param => {
          const skuIds = param.value.split(',')
          skuIds.map(async skuId => {
            const skuUrl = paths.sku(ioContext.account, skuId)
            const skuData = await http.get(skuUrl, { headers })
          })
        })
      })
    }
    return data.ratesAndBenefitsData ? data.ratesAndBenefitsData.teaser : []
  },


}