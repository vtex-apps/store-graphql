import http from 'axios'
import {complement,compose,drop,filter,find,isEmpty,map,match,pluck,prop,propEq,reduce,split,test} from 'ramda'

import paths from '../paths'
import { getMarketingDataFromSegment } from './marketingData'

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
const schemaBase = {
  $id: 'http://json-schema.org/draft-07/schema#',
  $schema: 'http://json-schema.org/draft-07/schema#',
  items: {},
  properties: {},
  required: [],
  type: 'object',
}

const returnEmpty = () => '{}'

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
 * @param {function} getSkuInfo
 *
 * @return {Object} parsedDomain
 */
const parseDomain = ({ FieldName, DomainValues }) => {
  const [minTotalItems, maxTotalItems, skusString] = matchAndDropFirst(domainValueRegex)(
    DomainValues
  )
  const required = minTotalItems > 0
  const multiple = maxTotalItems > 1

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
const generateSchema = ({ attachments }) =>
  attachments.reduce(
    (accumulated, { domainValues }) => {
      const { properties, items, required } = accumulated

      const { domainItems, domainProperties, domainRequired } = reduceAttachmentDomains(
        domainValues
      )

      return {
        items: { ...items, ...domainItems },
        properties: { ...properties, ...domainProperties },
        required: [...required, ...domainRequired],
      }
    },
    { properties: {}, items: {}, required: [] }
  )

/**
 * Filters only valid attachments conforming ro regex to generate the JSON Schema
 *
 * @param {*} { attachments }
 * @returns
 */
const filterValidAttachments = ({ attachments }) => {
  /**
   * Step 1 - Focuses on attachments.domainValues array, and filters domainValues that conform to the regex
   * Step 2 - Filters only attachments that have at least one domainValues array item
   *
   * OPTIMIZE: Maybe this can be made point-free, already negating from the
   * validAttachments if the deep filter `testDomainValues` returns no items.
   * Tried to R.transduce but it was more code to do the same thing.
   */
  const testDomainValues = filter(
    compose(
      test(domainValueRegex),
      prop('DomainValues')
    )
  )
  const validAttachments = reduce(
    (accumulator, attachment) => {
      const validDomainValues = testDomainValues(prop('domainValues', attachment))

      if (isEmpty(prop('domainValues', validDomainValues))) {
        return accumulator
      }
      return [...accumulator, { ...attachment, domainValues: validDomainValues }]
    },
    [],
    attachments
  )
  return validAttachments
}

const tryParse = str => {
  try {
    return JSON.parse(str)
  } catch (e) {
    return false
  }
}

export const queries = {
  /**
   * Create a calculated schema from the attachments, for `vtex.product-customizer` to consume
   * 
   * @param {*} _
   * @param {*} skuJSON
   * @param {*} { assert, cookies, dataSources: { session }, vtex: { account, authToken } }
   * @returns string
   */
  calculatedAttachments: async (
    _,
    skuJSON,
    { assert, cookies, dataSources: { session }, vtex: { account, authToken } }
  ) => {
    
    const sku = tryParse(skuJSON)
    if (!sku) {
      return returnEmpty()
    }

    const { attachments, name, sellers } = sku
    if (!attachments && !attachments.length) {
      return returnEmpty()
    }

    /**
     * NOTE:
     * Session cookies are a hard requirement in order to query priceTables
     * with the correct pricing values for that session.
     * In the case of delivery, each location can have it's own priceTable, with
     * different prices for different stores or geolocation regions.
     * It's also used to get the store's current salesChannel and country.
     *
     * TLDR.: No session cookies, no priceTables, no calculatedAttachments, no delivery.
     */
    const segment = cookies.get('vtex_segment')
    assert(
      segment,
      406,
      'Cookie vtex_segment is not set. Ensure that `vtex.session-app` is installed and working.'
    )

    const segmentData = await session.getSegmentData()
    const marketingData = getMarketingDataFromSegment(segmentData)
    const simulationUrl = paths.orderFormSimulation(account, {
      querystring: `sc=${segmentData.channel}&localPipeline=true`,
    })
    const skuByIdUrl = paths.skuById(account)
    const { sellerId } = find(propEq('sellerDefault', true), sellers) as Seller
    const schema = { title: name, ...schemaBase }

    const validAttachments = filterValidAttachments({ attachments })
    if (!validAttachments.length) {
      return returnEmpty()
    }

    const reducedAttachmentSchema = generateSchema({ attachments: validAttachments })

    const calculatedSchema = { ...schema, ...reducedAttachmentSchema }

    return JSON.stringify(calculatedSchema)
  },
}

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
