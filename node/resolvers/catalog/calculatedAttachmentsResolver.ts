import http from 'axios'
import { propEq, prop, head, find, map, pluck, isEmpty, pickBy, both } from 'ramda'
import { camelCase, renameKeysWith } from '../../utils'
import paths from '../paths'

type SchemaItem = {
  defaultQuantity: String
  id: String
  image: String
  maxQuantity: String
  minQuantity: String
  name: String
  price: Number
  priceTable: String
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
}) => async (schemaItem: SchemaItem) => {
  const { data: sku } = await http.get(`${skuByIdUrl}${schemaItem.id}`, { headers })

  /**
   * TODO:
   *
   * - get user login status
   */
  const payload = {
    items: [{ id: schemaItem.id, quantity: 1, seller: 1 }],
    country: countryCode,
    isCheckedIn: false,
    priceTables: [schemaItem.priceTable],
    ...(isEmpty(marketingData) ? {} : { marketingData }),
  }

  const orderForm = prop('data', await http.post(simulationUrl, payload, { headers }))

  return {
    ...schemaItem,
    name: sku.SkuName,
    description: sku.ProductDescription,
    image: prop('ImageUrl', head(sku.Images)),
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
const parseDomainSkus = ({ skusString, getSkuInfo }) =>
  map(async (item: String) => {
    const [_, id, minQuantity, maxQuantity, defaultQuantity, priceTable] = item.match(
      /#(\w+)\[(\d+)-(\d+)\]\[(\d+)\](\w*)/
    )

    const schemaSku = {
      id,
      minQuantity,
      maxQuantity,
      defaultQuantity,
      priceTable,
    }

    const skuInfo = await getSkuInfo(schemaSku)

    return skuInfo
  }, skusString.split(';').filter(str => str.length != 0))

/**
 * Parses DomainValues min/max values and get information for each sku
 *
 * @param {string} FieldName
 * @param {string} DomainValues
 * @param {function} getSkuInfo
 *
 * @return {Object} parsedDomain
 */
const parseDomain = async ({ FieldName, DomainValues, getSkuInfo }) => {
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
const reduceAttachments = ({ attachments, getSkuInfo }) =>
  attachments.reduce(
    async (accumulatedPromise, { domainValues }) => {
      const accumulated = await accumulatedPromise
      // If there are no attachments, do nothing and skip
      if (!attachments) return { ...accumulated }

      const { properties, items, required } = accumulated
      const attachmentDomainValues = JSON.parse(domainValues)

      const schemaFromDomains = await attachmentDomainValues.reduce(
        async (accumulatedPromise, { FieldName, DomainValues }) => {
          const accumulated = await accumulatedPromise
          if (!DomainValues || !domainValueRegex.test(DomainValues)) return { ...accumulated }
          const { domainProperties, domainItems, domainRequired } = accumulated
          const {
            minTotalItems,
            maxTotalItems,
            domainSkus,
            required,
            multiple,
          } = await parseDomain({
            FieldName,
            DomainValues,
            getSkuInfo,
          })

          const enumProperty = {
            type: 'string',
            enum: pluck('id')(domainSkus[FieldName]),
          }

          const property = multiple
            ? {
                type: 'array',
                items: enumProperty,
                minTotalItems,
                maxTotalItems,
                uniqueItems: true,
              }
            : enumProperty

          return {
            domainProperties: { ...domainProperties, [FieldName]: property },
            domainItems: { ...domainItems, ...domainSkus },
            domainRequired: [...domainRequired, ...(required ? [FieldName] : [])],
          }
        },
        { domainProperties: {}, domainItems: [], domainRequired: [] }
      )

      return {
        properties: {
          ...properties,
          ...schemaFromDomains.domainProperties,
        },
        items: { ...items, ...schemaFromDomains.domainItems },
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
  { name, attachments },
  _,
  { vtex: { account, authToken }, dataSources: { session } }
) => {
  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'http://json-schema.org/draft-07/schema#',
    title: name,
    type: 'object',
    required: [],
    properties: {},
    items: {},
  }

  const headers = {
    Accept: 'application/json',
    Authorization: `bearer ${authToken}`,
    'Content-Type': 'application/json',
  }

  const { segmentData } = await session.getSegmentData()
  const marketingData = renameKeysWith(camelCase, pickBy(isValidUtm, segmentData))

  const simulationUrl = paths.orderFormSimulation(account, {
    querystring: `sc=${segmentData.channel}&localPipeline=true`,
  })
  const skuByIdUrl = paths.skuById(account)

  const reducedAttachmentSchema = await reduceAttachments({
    attachments,
    getSkuInfo: getSkuInfo({
      simulationUrl,
      skuByIdUrl,
      marketingData,
      headers,
      segmentData,
    }),
  })

  const calculatedSchema = { ...schema, ...reducedAttachmentSchema }

  return JSON.stringify(calculatedSchema)
}
