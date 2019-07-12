import { find, isEmpty, path, prop, propEq } from 'ramda'

interface Params {
  id: string
  priceTable: string
  seller: string
  simulationPayload: {
    marketingData: Record<string, string>
    countryCode: string
  }
}

export const resolvers = {
  PriceTableItem: {
    price: async (
      { id, priceTable, seller, simulationPayload }: Params,
      _: any,
      { clients: { checkout } }: Context
    ) => {
      const { countryCode, marketingData } = simulationPayload
      const payload = {
        country: countryCode,
        isCheckedIn: false,
        items: [{ id, quantity: 1, seller }],
        priceTables: [priceTable],
        ...(isEmpty(marketingData) ? {} : { marketingData }),
      }
      const orderForm = (await checkout.simulation(payload)) as any
      const shouldCheckTotals =
        orderForm && path(['totals', 'length'], orderForm)
      return shouldCheckTotals
        ? prop(
            'value',
            find<any>(propEq('id', 'Items'))((orderForm as any).totals)
          )
        : 0
    },
  },
}
