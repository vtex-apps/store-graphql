import axios from 'axios'
import paths from '../paths'
import { flatten } from 'ramda'
import { withAuthToken } from '../headers'
import { resolveLocalProductFields } from '../catalog/fieldsResolver'

/**
 * Default values for Shipping Items
 */
const DEFAULT_QUANTITY = '1'
const DEFAULT_SELLER = '1'

/**
 * Retrieve a list of SKU Items.
 * @param skuIds List of the skuIds of the skus that must be retrieved.
 * @param ioContext VTEX ioContext which contains the informations of the application.
 */
const getSKUItems = async (skuIds, ioContext) => {
  return await Promise.all(skuIds.map(async skuId => {
    const { data } = await axios.get(paths.skuById(ioContext.account, { skuId }), { headers: { Authorization: ioContext.authToken }})
    return data
  }))
}

/**
 * Retrieve a product without benefits.
 * @param slug Slug of the product that must be retrieved.
 * @param ioContext VTEX ioContext which contains the informations of the application.
 */
const getProduct = async (slug, ioContext) => {
  const { data: [ product ] } = await axios.get(paths.product(ioContext.account, { slug }), { headers: withAuthToken()(ioContext) })
  return resolveLocalProductFields(product)
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
  
    const skuList = await Promise.all(conParams.map(async (conParam, index) => {
      const skuIds = conParam.value.split(',')
      const skuList = await getSKUItems(skuIds, ioContext)
      const discount = effParams[index].value
      const minQuantity = index ? 1 : minimumQuantity

      const benefitItems = await Promise.all(skuList.map(async sku => {
        const slug = sku.DetailUrl.split('/')[1]
        const product = await getProduct(slug, ioContext)

        return {
          product,
          discount,
          minQuantity
        }
      }))
      return benefitItems
    }))
    
    const { featured, id, name, teaserType } = benefit
    const items = flatten(skuList)
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