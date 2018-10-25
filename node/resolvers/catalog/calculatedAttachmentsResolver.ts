import http from 'axios'
import { both, find, head, isEmpty, map, pickBy, pluck, prop, propEq } from 'ramda'
import { camelCase, renameKeysWith } from '../../utils'
import paths from '../paths'

interface SchemaItem {
  defaultQuantity: string
  id: string
  image: string
  maxQuantity: string
  minQuantity: string
  name: string
  price: number
  priceTable: string
}

interface Seller {
  sellerId: number
  sellerDefault: boolean
}

const isTruthy = val => !!val
const isUtm = (_, key) => key.startsWith('utm')
const isValidUtm = both(isUtm, isTruthy)

const domainValueRegex = /^\[(\d+)-?(\d+)\]((?:#\w+\[\d+-\d+\]\[\d+\]\w*;?)+)/

/**
 * Gets name, description, images (from Search API) and priceTable (from Checkout API)
 * for a single SKU
 *
 * @param {string} simulationUrl
 * @param {Class} catalogDataSource
 * @param {Object} marketingData
 * @param {Object} headers
 *
 * @return {Object} skuInfo
 */
const getSkuInfo = ({
  simulationUrl,
  skuByIdUrl,
  marketingData,
  headers,
  segmentData: { countryCode },
  sellerId
}) => async (schemaItem: SchemaItem) => {
  const { data: sku } = await http.get(`${skuByIdUrl}${schemaItem.id}`, { headers })

  /**
   * TODO:
   *
   * - get user login status
   */
  const payload = {
    country: countryCode,
    isCheckedIn: false,
    items: [{ id: schemaItem.id, quantity: 1, seller: sellerId }],
    priceTables: [schemaItem.priceTable],
    ...(isEmpty(marketingData) ? {} : { marketingData }),
  }

  const orderForm = prop('data', await http.post(simulationUrl, payload, { headers }))

  return {
    ...schemaItem,
    description: sku.ProductDescription,
    image: prop('ImageUrl', head(sku.Images)),
    name: sku.SkuName,
    price: prop('value', find(propEq('id', 'Items'))(orderForm.totals)),
  }
}

/**
 * Parses the string for every sku on the DomainValues
 * eg.: #8[0-1][0]small;#9[0-1][0]small;#10[0-1][0]small;#11[0-1][0]small
 * Returns an object with min, max and default quantities, sku infos like name and price table value
 *
 * @param {string} skusString
 * @param {function} getSkuInfo
 *
 * @return {Array} parsedSku
 */
const parseDomainSkus = ({ skusString, getSkuInfo }) => // tslint:disable-line
  map(async (item: string) => {
    const [_, id, minQuantity, maxQuantity, defaultQuantity, priceTable] = item.match(
      /#(\w+)\[(\d+)-(\d+)\]\[(\d+)\](\w*)/
    )

    const schemaSku = {
      defaultQuantity,
      id,
      maxQuantity,
      minQuantity,
      priceTable,
    }

    const skuInfo = await getSkuInfo(schemaSku)

    return skuInfo
  }, skusString.split(';').filter(str => str.length !== 0))

/**
 * Parses DomainValues min/max values and get information for each sku
 *
 * @param {string} FieldName
 * @param {string} DomainValues
 * @param {function} getSkuInfo
 *
 * @return {Object} parsedDomain
 */
const parseDomain = async ({ FieldName, DomainValues, getSkuInfo }) => { // tslint:disable-line
  const [_, minTotalItems, maxTotalItems, skusString] = DomainValues.match(domainValueRegex)
  const required = minTotalItems > 0
  const multiple = maxTotalItems > minTotalItems

  const domainSkus = {
    [FieldName]: await Promise.all(parseDomainSkus({ skusString, getSkuInfo })),
  }

  return { minTotalItems, maxTotalItems, domainSkus, required, multiple }
}

/**
 * Recurses through all the attachments of a single SKU and all its children
 * to generate properties, items and required values for the schema
 *
 *
 * @param {Array<Object>} attachments
 * @param {function} getSkuInfo
 *
 * @returns {Object} schemaFromAttachments
 */
const reduceAttachments = ({ attachments, getSkuInfo }) => // tslint:disable-line
  attachments.reduce(
    async (accumulatedPromise, { domainValues }) => {
      const accumulated = await accumulatedPromise
      // If there are no attachments, do nothing and skip
      if (!attachments) { return { ...accumulated } }

      const { properties, items, required } = accumulated
      const attachmentDomainValues = JSON.parse(domainValues)

      const schemaFromDomains = await attachmentDomainValues.reduce(
        async (accumulatedPromise, { FieldName, DomainValues }) => { // tslint:disable-line
          const accumulated = await accumulatedPromise // tslint:disable-line
          if (!DomainValues || !domainValueRegex.test(DomainValues)) { return { ...accumulated } }
          const { domainProperties, domainItems, domainRequired } = accumulated
          const {
            minTotalItems,
            maxTotalItems,
            domainSkus,
            required, // tslint:disable-line
            multiple,
          } = await parseDomain({
            DomainValues,
            FieldName,
            getSkuInfo,
          })

          const enumProperty = {
            enum: pluck('id')(domainSkus[FieldName]),
            type: 'string',
          }

          const property = multiple
            ? {
                items: enumProperty,
                maxTotalItems,
                minTotalItems,
                type: 'array',
                uniqueItems: true,
              }
            : enumProperty

          return {
            domainItems: { ...domainItems, ...domainSkus },
            domainProperties: { ...domainProperties, [FieldName]: property },
            domainRequired: [...domainRequired, ...(required ? [FieldName] : [])],
          }
        },
        { domainProperties: {}, domainItems: [], domainRequired: [] }
      )

      return {
        items: { ...items, ...schemaFromDomains.domainItems },
        properties: {
          ...properties,
          ...schemaFromDomains.domainProperties,
        },
        required: [...required, ...schemaFromDomains.domainRequired],
      }
    },
    { properties: {}, items: {}, required: [] }
  )

/**
 * Create a calculated schema from the attachments, to control
 * the product-customizer component
 *
 * @returns string
 */
export default async (
  { name, attachments, sellers },
  _,
  { vtex: { account, authToken }, dataSources: { session } }
) => {
  const schema = {
    $id: 'http://json-schema.org/draft-07/schema#',
    $schema: 'http://json-schema.org/draft-07/schema#',
    items: {},
    properties: {},
    required: [],
    title: name,
    type: 'object',
  }

  const headers = {
    Accept: 'application/json',
    Authorization: `bearer ${authToken}`,
    'Content-Type': 'application/json',
  }

  const segmentData = await session.getSegmentData()
  const marketingData = renameKeysWith(camelCase, pickBy(isValidUtm, segmentData))

  const simulationUrl = paths.orderFormSimulation(account, {
    querystring: `sc=${segmentData.channel}&localPipeline=true`,
  })
  const skuByIdUrl = paths.skuById(account)

  const { sellerId } = find(propEq('sellerDefault', true) , sellers) as Seller

  const reducedAttachmentSchema = await reduceAttachments({
    attachments,
    getSkuInfo: getSkuInfo({
      headers,
      marketingData,
      segmentData,
      sellerId,
      simulationUrl,
      skuByIdUrl,
    }),
  })

  const calculatedSchema = { ...schema, ...reducedAttachmentSchema }

  return JSON.stringify(calculatedSchema)
}
