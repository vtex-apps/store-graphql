import axios from 'axios'
import { flatten } from 'ramda'

import { resolveLocalProductFields } from '../catalog/fieldsResolver'
import { withAuthToken } from '../headers'
import paths from '../paths'

/**
 * Default values for Shipping Items
 */
const DEFAULT_QUANTITY = '1'
const DEFAULT_SELLER = '1'

/**
 * Retrieve a product without benefits.
 * @param slug Slug of the product that must be retrieved.
 * @param ioContext VTEX ioContext which contains the informations of the application.
 */
const getProducts = async (skuIds, ioContext) => {
  const { data = [] } = await axios.get(paths.productBySkus(ioContext.account, { skuIds } ), { headers: withAuthToken()(ioContext) })
  return data.map(product => 
    resolveLocalProductFields(product)
  )
}

/**
 * Resolve the SKU Items of a list of benefits associated with a product.
 * @param benefits Benefits which contains the SKU Ids.
 * @param ioContext VTEX ioContext which contains the informations of the application.
 */
const getBenefitsWithSKUItems = async (benefits, ioContext) => {
  return Promise.all(benefits.map(async benefit => {    
    const { parameters: conParams, minimumQuantity } = benefit.conditions
    const effParams = benefit.effects.parameters
  
    const benefitItems = await Promise.all(conParams.map(async (conParam, index) => {
      const skuIds = conParam.value.split(',')
      const discount = effParams[index].value
      const minQuantity = index ? 1 : minimumQuantity
      const benefitProducts = await getProducts(skuIds, ioContext)

      return await Promise.all(benefitProducts.map(async product => {
        return {
          benefitProduct: product,
          discount,
          minQuantity
        }
      }))
    }))
    
    const { featured, id, name, teaserType } = benefit
    const items = flatten(benefitItems)
    return {
      featured,
      id,
      name,
      items,
      teaserType
    }
  }))
}

export const queries = {
  /**
   * There are two ways to make the request data
   * First of them is passing the graphql args with the items property which is an array of Shipping Items. 
   * Second is passing just the id of the product itself as a graphql argument.
   */
  benefits: async (_, args, { vtex: ioContext }) => {
    let requestBody
    if (args.items) {
      requestBody = { items: args.items }
    } else {
      requestBody = {
        items: [
          { 
            id: args.id,
            quantity: DEFAULT_QUANTITY,
            seller: DEFAULT_SELLER
          }
        ]
      }
    }

    const url = paths.shipping(ioContext.account)
    const { data } = await axios.post(url, requestBody, 
      { headers: { Authorization: ioContext.authToken } 
    })

    if (data && data.ratesAndBenefitsData && data.ratesAndBenefitsData.teaser) {
      const benefits = data.ratesAndBenefitsData.teaser
      return getBenefitsWithSKUItems(benefits, ioContext)
    }

    return []
  },
}