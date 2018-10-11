import http from 'axios'
import { propEq, prop, head, find, map, pluck, findIndex, isEmpty, pickBy, both } from 'ramda'
import { renameKeysWith } from 'ramda-adjunct'
import camelCase from 'lodash.camelcase'
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

type Sku = {
  complementName: String
  images: Array<{ imageUrl: String }>
  itemId: String
  name: String
}

const isTruthy = val => !!val
const isUtm = (_, key) => key.startsWith('utm')
const isValidUtm = both(isUtm, isTruthy)

const parseDomainSkus = skusString =>
  map((item: String) => {
    const [_, id, minQuantity, maxQuantity, defaultQuantity, priceTable] = item.match(
      /#(\w+)\[(\d+)-(\d+)\]\[(\d+)\](\w*)/
    )
    return { id, minQuantity, maxQuantity, defaultQuantity, priceTable }
  }, skusString.split(';'))

const parseDomain = DomainValues => {
  const [_, minTotalItems, maxTotalItems, skusString] = DomainValues.match(
    /^\[(\d+)-?(\d+)\]((?:#\w+\[\d+-\d+\]\[\d+\]\w*;?)+)/
  )
  const required = minTotalItems > 0
  const multiple = maxTotalItems > minTotalItems

  const domainSkus = parseDomainSkus(skusString)

  return { minTotalItems, maxTotalItems, domainSkus, required, multiple }
}

const getSkuInfo = ({ items, simulationUrl, catalogDataSource, marketingData, headers }) =>
  Promise.all(
    items
      // remove duplicate skus
      .filter((item, index, self) => index === findIndex((i: SchemaItem) => i.id === item.id)(self))
      // get name, image from sku and price from priceTable
      .map(async item => {
        const products = await catalogDataSource.productBySku([item.id])
        const { items: skus = [] } = head(products) || {}
        const sku: Sku = find(({ itemId }) => itemId === item.id, skus)

        /**
         *
         * TODO:
         * =====
         *
         * - get store salesChannel
         * - get store country
         * - get user login status
         *
         */
        const payload = {
          items: [{ id: item.id, quantity: 1, seller: 1 }],
          country: 'BRA',
          isCheckedIn: false,
          priceTables: [item.priceTable],
          ...(isEmpty(marketingData) ? {} : { marketingData }),
        }

        const orderForm = prop('data', await http.post(simulationUrl, payload, { headers }))

        return {
          ...item,
          name: sku.name,
          description: sku.complementName,
          image: head(sku.images).imageUrl,
          price: prop('value', find(propEq('id', 'Items'))(orderForm.totals)),
        }
      })
  )

const reduceAttachments = attachments =>
  attachments.reduce(
    (accumulated, { domainValues }) => {
      // If there are no attachments, do nothing and skip
      if (!attachments) return { ...accumulated }

      const { schemaProperties, schemaItems, schemaRequired } = accumulated
      const attachmentDomainValues = JSON.parse(domainValues)

      const schemaFromDomains = attachmentDomainValues.reduce(
        (accumulated, { FieldName, DomainValues }) => {
          if (!DomainValues) return { ...accumulated }
          const { domainProperties, domainItems, domainRequired } = accumulated
          const { minTotalItems, maxTotalItems, domainSkus, required, multiple } = parseDomain(
            DomainValues
          )

          const enumProperty = {
            type: 'string',
            enum: pluck('id')(domainSkus),
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
            domainItems: [...domainItems, ...domainSkus],
            domainRequired: [...domainRequired, required ? FieldName : null],
          }
        },
        { domainProperties: {}, domainItems: [], domainRequired: [] }
      )

      return {
        schemaProperties: { ...schemaProperties, ...schemaFromDomains.domainProperties },
        schemaItems: [...schemaItems, ...schemaFromDomains.domainItems],
        schemaRequired: [...schemaRequired, ...schemaFromDomains.domainRequired],
      }
    },
    { schemaProperties: {}, schemaItems: [], schemaRequired: [] }
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
  { vtex: { account, authToken }, dataSources: { catalog, session } }
) => {
  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'http://json-schema.org/draft-07/schema#',
    title: name,
    type: 'object',
    required: [],
    properties: {},
    items: [],
  }

  const headers = {
    Accept: 'application/json',
    Authorization: `bearer ${authToken}`,
    'Content-Type': 'application/json',
  }

  const simulationUrl = paths.orderFormSimulation(account, {querystring: 'sc=1&localPipeline=true'})

  const utms = await session.getSegmentData()
  const marketingData = renameKeysWith(camelCase, pickBy(isValidUtm, utms))

  const reducedAttachment = reduceAttachments(attachments)

  const items = await getSkuInfo({
    items: reducedAttachment.schemaItems,
    simulationUrl,
    catalogDataSource: catalog,
    marketingData,
    headers,
  })

  const calculatedSchema = {
    ...schema,
    ...{
      properties: reducedAttachment.schemaProperties,
      required: reducedAttachment.schemaRequired,
      items: items,
    },
  }

  return JSON.stringify(calculatedSchema)
}
