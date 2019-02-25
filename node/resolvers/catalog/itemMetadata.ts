import http from 'axios'
import * as camelCase from 'camelcase'
import { both, find, isEmpty, pickBy, prop, propEq } from 'ramda'
import { renameKeysWith } from '../../utils'
import paths from '../paths'

import { MetadataItem } from '../checkout/types'

import { SessionDataSource } from '../../dataSources/session'

const headersWithToken = (authToken) => ({
  Accept: 'application/json',
  Authorization: `bearer ${authToken}`,
  'Content-Type': 'application/json',
})

const isTruthy = val => !!val
const isUtm = (_, key) => key.startsWith('utm')
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
  return {
    id,
    price: orderForm ? prop('value', find(propEq('id', 'Items'))(orderForm.data.totals)) : 0,
    priceTable,
  }
}

const getSimulationPayload = async (session: SessionDataSource, account: string, authToken: string) => {
  const segmentData = await session.getSegmentData().catch(() => null)
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

export const resolvers = {
  ItemMetadata: {
    priceTable: async ({items}: Parent, _, { vtex: { account, authToken }, dataSources: { session } }: Context) => {
      const itemsToFetch = [] as Array<{ id: string, priceTable: string, seller: string }>
      items.filter(item => item.assemblyOptions.length > 0).map(item => {
        const { assemblyOptions } = item
        assemblyOptions.map(({ composition: { items: compItems } }) => { 
          compItems.map(({ id, priceTable, seller }) => itemsToFetch.push({ id, priceTable, seller }))
        })
      })

      const fetchPayload = await getSimulationPayload(session, account, authToken)

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
