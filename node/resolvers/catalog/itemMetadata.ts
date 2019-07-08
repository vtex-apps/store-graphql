import { Segment } from '@vtex/api'
import camelCase from 'camelcase'
import { both, pickBy } from 'ramda'
import { renameKeysWith } from '../../utils'

const isTruthy = (val?: string) => !!val
const isUtm = (_: any, key: string | number) => String(key).startsWith('utm')
const isValidUtm = both(isUtm, isTruthy)

interface Parent {
  items: MetadataItem[]
}

interface SimulationPayload {
  countryCode: string
  marketingData: Record<string, string>
}

const getSimulationPayload = async (
  segment: Segment
): Promise<SimulationPayload> => {
  const segmentData = await segment.segment()

  let marketingData: Record<string, string> = {}
  try {
    marketingData = renameKeysWith(
      camelCase,
      pickBy(isValidUtm, segmentData)
    ) as Record<string, string>
  } catch (e) {
    // TODO: Log to Splunk
    console.error(e)
  }

  return {
    countryCode: segmentData.countryCode,
    marketingData,
  }
}

type PriceTableMap = Record<
  string,
  {
    id: string
    priceTable: string
    seller: string
    simulationPayload: SimulationPayload
  }[]
>

export const resolvers = {
  ItemMetadata: {
    priceTable: async (
      { items }: Parent,
      _: any,
      { clients: { segment } }: Context
    ) => {
      const simulationPayload = await getSimulationPayload(segment)
      const itemsWithAssembly = items.filter(
        item => item.assemblyOptions.length > 0
      )
      const priceTableMap: PriceTableMap = {}
      for (const item of itemsWithAssembly) {
        const { assemblyOptions } = item
        for (const assemblyOption of assemblyOptions) {
          const { composition } = assemblyOption
          if (composition && composition.items) {
            for (const compItem of composition.items) {
              const { id, priceTable, seller } = compItem
              const currentArray = priceTableMap[priceTable] || []
              currentArray.push({ id, priceTable, seller, simulationPayload })
              priceTableMap[priceTable] = currentArray
            }
          }
        }
      }
      return Object.entries(priceTableMap).map(
        ([priceTableName, priceTableValues]) => ({
          type: priceTableName,
          values: priceTableValues,
        })
      )
    },
  },
}
