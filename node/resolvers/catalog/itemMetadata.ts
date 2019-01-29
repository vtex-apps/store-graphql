import http from 'axios'
import * as camelCase from 'camelcase'
import { both, find, isEmpty, pickBy, prop, propEq } from 'ramda'
import { renameKeysWith } from '../../utils'
import paths from '../paths'

const isTruthy = val => !!val
const isUtm = (_, key) => key.startsWith('utm')
const isValidUtm = both(isUtm, isTruthy)

interface ItemMetadata {
  id: string,
  name: string,
  skuName: string,
  productId: string,
  refId: string,
  ean: string | null,
  imageUrl: string,
  detailUrl: string,
  assemblyOptions: Array<{
    id: string,
    name: string,
    required: boolean,
    inputValues: any,
    composition: {
      minQuantity: number,
      maxQuantity: number,
      items: Array<{
        id: string,
        minQuantity: number,
        maxQuantity: number,
        priceTable: string,
        seller: string,
      }>,
    }
  }>,
}

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
  items: ItemMetadata[],
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
  const orderForm = prop('data', await http.post(url, payload, { headers }))
  return {
    id,
    price: prop('value', find(propEq('id', 'Items'))(orderForm.totals)),
    priceTable,
  }
}

export const resolvers = {
  ItemMetadata: {
    priceTable: async ({items}: Parent, _, { vtex: { account, authToken }, dataSources: { session } }) => {
      const headers = {
        Accept: 'application/json',
        Authorization: `bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    
      const segmentData = await session.getSegmentData()
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
  
      const itemsToFetch = [] as Array<{ id: string, priceTable: string, seller: string }>
      items.filter(item => item.assemblyOptions.length > 0).map(item => {
        const { assemblyOptions } = item
        assemblyOptions.map(({ composition: { items: compItems } }) => { 
          compItems.map(({ id, priceTable, seller }) => itemsToFetch.push({ id, priceTable, seller }))
        })
      })
  
      const priceData = await Promise.all(itemsToFetch.map(({ id, priceTable, seller }) => 
        fetchPrice({ id, priceTable, countryCode: segmentData.countryCode, seller, marketingData, headers, url: simulationUrl })))
      
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
