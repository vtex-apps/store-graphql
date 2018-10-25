import http from 'axios'
import {
  both,
  complement,
  compose,
  drop,
  filter,
  find,
  head,
  isEmpty,
  map,
  match,
  pickBy,
  pluck,
  prop,
  propEq,
  split,
} from 'ramda'
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
const isNotEmpty = complement(isEmpty)
const splitBySemiColon = split(';')
const splitAndFilterEmpty = compose(
  filter(isNotEmpty),
  splitBySemiColon
)
/** When there's multiple nested groups in a regex, the first index is the full match, which we don't need */
const matchAndDropFirst = regex =>
  compose(
    drop(1),
    match(regex)
  )

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
  sellerId,
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
 *
 * @return {Array} parsedSku
 */
const parseDomainSkus = ({ skusString }) =>
  map(item => {
    const [id, minQuantity, maxQuantity, defaultQuantity, priceTable] = matchAndDropFirst(
      /#(\w+)\[(\d+)-(\d+)\]\[(\d+)\](\w*)/
    )(item)

    return { defaultQuantity, id, maxQuantity, minQuantity, priceTable }
  }, splitAndFilterEmpty(skusString)) as [SchemaItem]

/**
 * Parses DomainValues min/max values and get information for each sku
 *
 * @param {string} FieldName
 * @param {string} DomainValues
 *
 * @return {Object} parsedDomain
 */
const parseDomain = ({ FieldName, DomainValues }) => {
  const [minTotalItems, maxTotalItems, skusString] = matchAndDropFirst(domainValueRegex)(
    DomainValues
  )
  const required = minTotalItems > 0
  const multiple = maxTotalItems > minTotalItems

  const domainSkus = { [FieldName]: parseDomainSkus({ skusString }) }

  return { minTotalItems, maxTotalItems, domainSkus, required, multiple }
}

const reduceAttachmentDomains = attachmentDomains =>
  attachmentDomains.reduce(
    (accumulated, { FieldName, DomainValues }) => {
      if (!DomainValues || !domainValueRegex.test(DomainValues)) {
        return accumulated
      }
      const { domainProperties, domainItems, domainRequired } = accumulated
      const { minTotalItems, maxTotalItems, domainSkus, required, multiple } = parseDomain({
        DomainValues,
        FieldName,
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

/**
 * Recurses through all the attachments of a single SKU and all its children
 * to generate properties, items and required values for the schema
 *
 * @param {Array<Object>} attachments
 *
 * @returns {Object} schemaFromAttachments
 */
const reduceAttachments = ({ attachments }) =>
  attachments.reduce(
    (accumulated, { domainValues }) => {
      // If there are no attachments, do nothing and skip
      if (!attachments) {
        return accumulated
      }

      const { properties, items, required } = accumulated
      const attachmentDomains = JSON.parse(domainValues)

      const schemaFromDomains = reduceAttachmentDomains(attachmentDomains)

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

  // const headers = {
  //   Accept: 'application/json',
  //   Authorization: `bearer ${authToken}`,
  //   'Content-Type': 'application/json',
  // }

  // const segmentData = await session.getSegmentData()
  // const marketingData = renameKeysWith(camelCase, pickBy(isValidUtm, segmentData))

  // const simulationUrl = paths.orderFormSimulation(account, {
  //   querystring: `sc=${segmentData.channel}&localPipeline=true`,
  // })
  // const skuByIdUrl = paths.skuById(account)

  // const { sellerId } = find(propEq('sellerDefault', true), sellers) as Seller

  const reducedAttachmentSchema = reduceAttachments({ attachments })

  const calculatedSchema = { ...schema, ...reducedAttachmentSchema }

  return JSON.stringify(calculatedSchema)
}
