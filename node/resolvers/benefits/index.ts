import axios from 'axios'
import { flatten } from 'ramda'

import { resolveLocalProductFields } from '../catalog/fieldsResolver'
import { withAuthToken } from '../headers'
import paths from '../paths'

const SKU_SEPARATOR = ','
const CATALOG = 'Catalog'
const DEFAULT_SELLER = '1'
const DEFAULT_QUANTITY = '1'

/**
 * Receives an Array of SKU Ids and returns an Array of the Products that each SKU Belongs.
 *
 * @param skuIds Array of SKU Ids which will be used to retrieve all the products that each SKU belongs.
 * @param ioContext Helper object which holds the account and the authentication headers.
 */
const resolveProducts = async (skuIds, ioContext) => {
  const requestUrl = paths.productBySkus(ioContext.account, { skuIds })
  const requestHeaders = {
    headers: withAuthToken()(ioContext),
  }
  const { data: products = [] } = await axios.get(requestUrl, requestHeaders)
  return await Promise.all(
    products.map(product => resolveLocalProductFields(product))
  )
}

/**
 * Receives an array of Rates and Benefits data and returns an Array of Benefits.
 *
 * @param benefitsData Array of Rates and Benefits data.
 * @param ioContext Helper object which holds the account and the authentication headers.
 */
const resolveBenefitsData = async (benefitsData, ioContext) => {
  let resolvedBenefits = []

  if (benefitsData.ratesAndBenefitsData) {
    const {
      ratesAndBenefitsData: { teaser: benefits = [] },
    } = benefitsData

    resolvedBenefits = await Promise.all(
      benefits.map(async benefit => {
        const { id, featured, name, teaserType, conditions, effects } = benefit

        if (teaserType === CATALOG) {
          const {
            parameters: conditionsParameters,
            minimumQuantity = parseInt(DEFAULT_QUANTITY),
          } = conditions

          const { parameters: effectsParameters } = effects

          const benefitProducts = await Promise.all(
            conditionsParameters.map(async (conditionsParameter, index) => {
              const skuIds = conditionsParameter.value.split(SKU_SEPARATOR)
              const discount = effectsParameters[index].value
              const products = await resolveProducts(skuIds, ioContext)

              return await Promise.all(
                products.map(async product => ({
                  product,
                  discount,
                  minimumQuantity,
                }))
              )
            })
          )

          const products = flatten(benefitProducts)

          return {
            id,
            featured,
            name,
            products,
          }
        }
      })
    )
  }

  return resolvedBenefits
}

export const queries = {
  /**
   * There are two ways to make the request data
   * First of them is passing the graphql args with the items property which is an array of Shipping Items.
   * Second is passing just the id of the product itself as a graphql argument.
   */
  benefits: async (_, args, { vtex: ioContext }) => {
    const requestUrl = paths.shipping(ioContext.account)

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

    const requestHeaders = {
      headers: {
        Authorization: ioContext.authToken,
      },
    }

    const { data: benefitsData = {} } = await axios.post(
      requestUrl,
      requestBody,
      requestHeaders
    )

    return await resolveBenefitsData(benefitsData, ioContext)
  },
}
