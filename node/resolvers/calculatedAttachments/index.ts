import { complement, compose, drop, filter, find, head, isEmpty, map, mapObjIndexed, match, pluck, prop, propEq, reduce, split, test } from 'ramda'

import ResolverError from '../../errors/resolverError'
import { headers } from '../headers'
import httpResolver from '../httpResolver'
import paths from '../paths'

import { getMarketingDataFromSegment } from './marketingData'

const makeRequest = async (_, args, config, url, data?, method?) => {
  const response = await httpResolver({
    data,
    enableCookies: true,
    headers: (ctx: any) => ({
      ...headers.json,
      'Proxy-Authorization': `${ctx.authToken}`,
    }),
    merge: (bodyData, responseData, res) => {
      return { ...res }
    },
    method,
    url,
  })(_, args, config)
  if (response.status > 400) {
    throw new ResolverError('ERROR', response.data)
  }
  return response
}

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

export const queries = {
  /**
   * Create a calculated schema from the attachments, for `vtex.product-customizer` to consume
   *
   * @param {*} _
   * @param {*} skuJSON
   * @param {*} { assert, cookies, dataSources: { session }, vtex: { account, authToken } }
   * @returns string
   */
  calculatedAttachments: async (_, { sku, sellerId }, ctx) => {
    const {
      assert,
      cookies,
      dataSources,
      vtex: { account },
    } = ctx
    const { attachments, name } = sku
    if (!attachments && !attachments.length) {
      return returnEmpty()
    }

    /**
     * NOTE:
     * Session cookies are a hard requirement in order to get the current session's salesChannel and countryCode.
     * This is needed to get the correct prices from checkout.
     * It also can be used to query priceTables with the segment information.
     *
     * TLDR.: No session cookies, no salesChannel, no calculatedAttachments, no delivery.
     */
    const segment = cookies.get('vtex_segment')
    // TODO: Log to Splunk
    assert(
      segment,
      406,
      'Cookie vtex_segment is not set. Ensure that `vtex.session-app` is installed and working.'
    )

    const segmentData = await dataSources.session.getSegmentData()
    const marketingData = getMarketingDataFromSegment(segmentData)

    const validAttachments = filterValidAttachments({ attachments })
    if (!validAttachments.length) {
      return returnEmpty()
    }

    const generatedSchema = generateSchema({ attachments: validAttachments })

    const schemaItemsWithPricePromises = mapObjIndexed(
      value =>
        new Promise(async resolveItems => {
          const skuPromises = map(
            (schemaItem: SchemaItem) =>
              new Promise(async resolveItem => {
                // TODO: get user login status
                const payload = {
                  country: segmentData.countryCode,
                  isCheckedIn: false,
                  items: [{ id: schemaItem.id, quantity: 1, seller: sellerId }],
                  priceTables: [schemaItem.priceTable],
                  ...(!isEmpty(marketingData) && { marketingData }),
                }

                const orderFormPromise = dataSources.checkout.simulation(payload, {
                  localPipeline: true,
                  sc: segmentData.channel,
                })

                const skuPromise = makeRequest(_, '', ctx, paths.skuById(account, schemaItem.id))

                const [{ data: skuData }, orderForm] = await Promise.all([
                  skuPromise,
                  orderFormPromise,
                ])

                resolveItem({
                  ...schemaItem,
                  description: skuData.ProductDescription,
                  image: prop('ImageUrl', head(skuData.Images)),
                  name: skuData.SkuName,
                  price: prop('value', find(propEq('id', 'Items'))(orderForm.totals)),
                })
              }),
            value
          ) as [Promise<SchemaItem>]

          resolveItems(Promise.all(skuPromises))
        }),
      generatedSchema.items
    )

    const schemaItemsWithPrice = await Promise.props(schemaItemsWithPricePromises)

    const calculatedSchema = {
      title: name,
      ...schemaBase,
      ...generatedSchema,
      items: schemaItemsWithPrice,
    }

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
