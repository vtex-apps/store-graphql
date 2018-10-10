import http from 'axios'
import { propEq, prop, head, find, map, pick, findIndex } from 'ramda'
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
  name: String
  images: Array<{ imageUrl: String }>,
  itemId: String
}

/**
 * Create a calculated schema from the attachments, to control
 * the product-customizer component
 *
 * @returns string
 */
export default async (
  { name, attachments },
  _,
  { vtex: { account, authToken }, dataSources: { catalog }, cookies }
) => {
  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'http://json-schema.org/draft-07/schema#',
    title: name,
    type: 'object',
    required: [],
    properties: {},
    items: []
  }

  const headers = {
    Accept: 'application/json',
    Authorization: `bearer ${authToken}`,
    'Content-Type': 'application/json',
  }

  const segment = cookies.get('vtex_segment') || ''

  const reduced = attachments.reduce(
    (accumulated, { domainValues }) => {
      // If there are no attachments, do nothing and skip
      if (!attachments) return { ...accumulated }

      const { schemaProperties, schemaItems, schemaRequired } = accumulated
      const attachmentDomainValues = JSON.parse(domainValues)

      const schemaFromDomains = attachmentDomainValues.reduce(
        (accumulated, { FieldName, DomainValues }) => {
          const { domainProperties, domainItems, domainRequired } = accumulated
          const [_, minTotalItems, maxTotalItems] = DomainValues.match(/^\[(\d+)-?(\d*)\]/)

          const domainSkusRegexp = /#\w+\[\d+-\d+\]\[\d+\]\w*/g
          const domainSkus = map((item: String) => {
            const [_, id, minQuantity, maxQuantity, defaultQuantity, priceTable] = item.match(
              /#(\w+)\[(\d+)-(\d+)\]\[(\d+)\](\w*)/
            )
            return { id, minQuantity, maxQuantity, defaultQuantity, priceTable }
          }, DomainValues.match(domainSkusRegexp))

          const multiple = maxTotalItems > minTotalItems
          const enumProperty = {
            type: 'string',
            enum: pick('id', domainSkus),
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

          const required = minTotalItems > 0

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

  const items = await Promise.all(
    reduced.schemaItems
      // remove duplicate skus
      .filter((item, index, self) => index === findIndex((i: SchemaItem) => i.id === item.id)(self))
      // get name, image from sku and price from priceTable
      .map(async item => {
        const products = await catalog.productBySku([item.id])
        const { items: skus = [] } = head(products) || {}
        const sku: Sku = find(({ itemId }) => itemId === item.id, skus)

        /**
         *
         * TODO:
         * =====
         *
         * - get store salesChannel
         * - get store utms/marketingData
         * - get store country
         * - get user login status
         *
         */
        const querystring = 'sc=1&localPipeline=true'
        const simulationUrl = paths.orderFormSimulation(account, { querystring })
        const payload = {
          items: [{ id: item.id, quantity: 1, seller: 1 }],
          country: 'BRA',
          isCheckedIn: false,
          priceTables: [item.priceTable],
          ...(segment
            ? {
                marketingData: {
                  utmSource: segment,
                  utmCampaign: segment,
                  utmiCampaign: segment,
                },
              }
            : {}),
        }

        const orderForm = prop('data', await http.post(simulationUrl, payload, { headers }))

        return {
          ...item,
          name: sku.name,
          image: sku.images[0].imageUrl,
          price: prop('value', find(propEq('id', 'Items'))(orderForm.totals)),
        }
      })
  )

  const calculatedSchema = {
    ...schema,
    ...{
      properties: reduced.schemaProperties,
      required: reduced.schemaRequired,
      items: items,
    },
  }

  return JSON.stringify(calculatedSchema)
}
