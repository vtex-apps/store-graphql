import { headers, withAuthAsVTEXID, withAuthToken,  } from '../headers'
import httpResolver from '../httpResolver'
import paths from '../paths'

const parseLogisticAddress = (logAddress, idx) => ({
  ...logAddress,
  addressId: idx.toString(),
  addressType: 'pickup',
  country: logAddress.country.acronym,
  geoCoordinates: [-43.1825731, -22.9460815],
})

const parseItem = (logisticItem, idx) => ({
  ...logisticItem,
  address: parseLogisticAddress(logisticItem.address, idx),
  friendlyName: logisticItem.name,
})

interface PickupPointsArgs {
  lat: string,
  long: string,
}

export const queries = {
  logistics: httpResolver({
    headers: withAuthToken(headers.json),
    method: 'GET',
    url: (account: string) => paths.logisticsConfig(account).shipping,
  }),
  pickupPoints: async (root, args: PickupPointsArgs, context) => {
    const { vtex: ioContext, request } = context
    const fullHeader = withAuthToken(headers.json)(ioContext, request.headers.cookie)
    const response = await httpResolver({
      headers: fullHeader,
      method: 'GET',
      url: (account: string, { lat, long }: PickupPointsArgs) => paths.logisticsConfig(account).pickupPoints(lat, long),
    })(root, args, context)
    return { 
      ...response, 
      items: (response.items || []).map((item, idx) => parseItem(item, idx)),
    }
},
}
