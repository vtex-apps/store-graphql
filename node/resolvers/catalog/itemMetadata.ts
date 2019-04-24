import { Segment } from '@vtex/api'
import http from 'axios'
import camelCase from 'camelcase'
import { both, find, isEmpty, path, pickBy, prop, propEq } from 'ramda'
import { renameKeysWith } from '../../utils'
import paths from '../paths'

import { MetadataItem } from '../checkout/types'

const headersWithToken = (authToken: any) => ({
  Accept: 'application/json',
  Authorization: `bearer ${authToken}`,
  'Content-Type': 'application/json',
})

const isTruthy = (val: any) => !!val
const isUtm = (_: any, key: any) => key.startsWith('utm')
const isValidUtm = both(isUtm, isTruthy)

interface FetchPriceInput {
  id: string,
  priceTable: string,
  marketingData: any,
  countryCode: string,
  seller: string,
  headers: any,
  url: string,
}

interface ItemToFetch { 
  id: string
  priceTable: string
  seller: string
}

interface Parent {
  items: MetadataItem[],
}

interface PriceType {
  id: string,
  price: number,
  priceTable: string
}
const fetchPrice = async ({
  id,
  priceTable,
  countryCode,
  seller,
  marketingData,
  headers,
  url,
}: FetchPriceInput):Promise<PriceType> => {
  // TODO: optimize this call sending multiple ids and/or priceTable...
  const payload = {
    country: countryCode,
    isCheckedIn: false,
    items: [{ id, quantity: 1, seller }],
    priceTables: [priceTable],
    ...(isEmpty(marketingData) ? {} : { marketingData }),
  }
  const orderForm = await http.post(url, payload, { headers }).catch(() => null)
  const shouldCheckTotals = orderForm && path(['data', 'totals', 'length'], orderForm)
  return {
    id,
    price: shouldCheckTotals? prop('value', find<any>(propEq('id', 'Items'))((orderForm as any).data.totals)) : 0,
    priceTable,
  }
}

const getSimulationPayload = async (segment: Segment, account: string, authToken: string) => {
  const segmentData = await segment.segment().catch(() => null)
  if (!segmentData) { return null }

  let marketingData = {}
  try {
    marketingData = renameKeysWith(camelCase, pickBy(isValidUtm, segmentData))
  } catch (e) {
    // TODO: Log to Splunk
    console.error(e)
  }

  const simulationUrl = paths.orderFormSimulation(account, {
    querystring: `sc=${segmentData.channel}&localPipeline=true`,
  })
  return {
    countryCode: segmentData.countryCode as string,
    headers: headersWithToken(authToken),
    marketingData,
    url: simulationUrl,
  }
}

const buildItemsToFetch = (items: MetadataItem[]) => {
  const itemsToFetch = [] as ItemToFetch[]
  const itemsWithAssembly = items.filter(item => item.assemblyOptions.length > 0)
  for (const item of itemsWithAssembly) {
    const { assemblyOptions } = item
    for (const assemblyOption of assemblyOptions) {
      const { composition } = assemblyOption
      if (composition && composition.items) {
        for (const compItem of composition.items) {
          const { id, priceTable, seller } = compItem
          itemsToFetch.push({ id, priceTable, seller })
        }
      }
    }
  }
  return itemsToFetch
}

export const resolvers = {
  ItemMetadata: {
    priceTable: async ({items}: Parent, _: any, { vtex: { account, authToken }, clients: { segment } }: Context) => {
      const fetchPayload = await getSimulationPayload(segment, account, authToken)
      const itemsToFetch = buildItemsToFetch(items)
      const itemsPromises = itemsToFetch.map(({ id, priceTable, seller }) => {
        if (!fetchPayload) { return { id, priceTable, price: 0 } }
        return fetchPrice({ ...fetchPayload, id, priceTable, seller })
      })

      const priceData = await Promise.all(itemsPromises)

      const prices = priceData.reduce<{ [key: string]: Array<{ price: number, id: string }>}>((prev, curr) => {
        const { id, priceTable, price } = curr
        const currentArray = prev[priceTable] || []
        return {
          ...prev,
          [priceTable]: [...currentArray, { id, price }]
        }
      }, {})

      return Object.entries(prices).map(([priceTableName, priceArray]) => ({ type: priceTableName, values: priceArray }))
    },
  }
}
