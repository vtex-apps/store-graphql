import http from 'axios'
import * as camelCase from 'camelcase'
import { both, find, head, isEmpty, map, pickBy, prop, propEq } from 'ramda'

import { SegmentData } from '../../dataSources/session'
import { renameKeysWith } from '../../utils'
import paths from '../paths'

interface AttachmentDomainData {
  defaultQuantity: string
  id: string
  maxQuantity: string
  minQuantity: string
  priceTable: string
}

interface AttachmentData extends AttachmentDomainData {
  description: string
  image: string
  name: string
  price: number
}

interface RequestsConfiguration {
  account : string,
  authToken : string,
  segmentData: SegmentData,
  sellerId: number
}

const domainValueRegex = /^\[(\d+)-?(\d+)\]((?:#\w+\[\d+-\d+\]\[\d+\]\w*;?)+)/

const getSkuData = async (
  schemaItem: AttachmentDomainData,
  requestsConfig: RequestsConfiguration
): Promise<AttachmentData> => {
  const { skuRequest, orderFormSimulationRequest } = fetchOrderSimulationAndSku(schemaItem, requestsConfig)
  const [
    { data: sku = {} } = {},
    { data: orderForm = {} } = {},
  ] = await Promise.all([skuRequest, orderFormSimulationRequest])

  return {
    ...schemaItem,
    description: sku.ProductDescription,
    image: prop('ImageUrl', head(sku.Images)),
    name: sku.SkuName,
    price: prop('value', find(propEq('id', 'Items'))(orderForm.totals)),
  }
}

const fetchOrderSimulationAndSku = (
  item: AttachmentDomainData,
  { account, authToken, segmentData, sellerId }: RequestsConfiguration,
) => {
  const headers = {
    Accept: 'application/json',
    Authorization: `bearer ${authToken}`,
    'Content-Type': 'application/json',
  }

  const skuByIdUrl = paths.skuById(account)
  const simulationUrl = paths.orderFormSimulation(
    account,
    { querystring: `sc=${segmentData.channel}&localPipeline=true` }
  )

  let marketingData = {}
  try {
    const isTruthy = val => !!val
    const isUtm = (_, key) => key.startsWith('utm')
    const isValidUtm = both(isUtm, isTruthy)

    marketingData = renameKeysWith(camelCase, pickBy(isValidUtm, segmentData))
  } catch (e) {
    // TODO: Log to Splunk
    console.error(e)
  }

  const getOrderFormPayload = ({ id, priceTable }) => ({
    country: segmentData.countryCode,
    isCheckedIn: false,
    items: [{ id, quantity: 1, seller: sellerId }],
    priceTables: [priceTable],
    ...(isEmpty(marketingData) ? {} : { marketingData }),
  })

  return {
    orderFormSimulationRequest:
      http.post(simulationUrl, getOrderFormPayload(item), { headers }),
    skuRequest:
      http.get(`${skuByIdUrl}${item.id}`, { headers })
  }
}

const parseDomainSku = (item): AttachmentDomainData => {
  const matchResult = item.match(/#(\w+)\[(\d+)-(\d+)\]\[(\d+)\](\w*)/)
  if (matchResult == null) {
    return null
  }
  const [_, id, minQuantity, maxQuantity, defaultQuantity, priceTable] = matchResult
  return { defaultQuantity, id, maxQuantity, minQuantity, priceTable }
}

const processDomainSkus = async (DomainValues, requestsConfiguration) => {
  const matchResult = DomainValues.match(domainValueRegex)
  if (matchResult == null) {
    return null
  }
  const [_, __, ___, skusString] = matchResult
  const skusInfo = skusString.split(';')
    .filter(str => str.length !== 0)
    .map(parseDomainSku)
    .filter(obj => obj != null) as AttachmentData[]
  return await Promise.all(
    map(skuInfo => getSkuData(skuInfo, requestsConfiguration), skusInfo)
  )
}

export const attachmentItemsResolver = async (
  { DomainValues, sellers },
  _,
  { vtex: { account, authToken }, dataSources: { session } } : ServiceContext
) => {
  const { sellerId } = find(propEq('sellerDefault', true), sellers) as { sellerId: number }
  const segmentData = await session.getSegmentData()
  const requestsConfiguration = { account, authToken, segmentData, sellerId }
  return await processDomainSkus(DomainValues, requestsConfiguration)
}

export const attachmentPropertiesResolver = async ({ DomainValues }) => {
  const [_, minTotalItems, maxTotalItems] = DomainValues.match(domainValueRegex)
  return { minTotalItems, maxTotalItems }
}