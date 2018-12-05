import { headers, withAuthToken,  } from '../headers'
import httpResolver from '../httpResolver'
import paths from '../paths'

interface CommonAddress {
  postalCode: string,
  city: string,
  state: string,
  neighborhood: string,
  street: string,
  number: string,
  complement: string,
  reference: string,
}

interface LogisticAddress extends CommonAddress {
  country: { acronym: string, name: string },
  location: { latitude: number, longitude: number },
} 

interface ParsedAddress extends CommonAddress {
  geoCoordinates: number[],
  addressId: string,
  addressType: string,
  country: string,
}

interface CommonPickupPoint {
  id: string,
  description: string | null,
  instructions: string,
  formatted_address: string | null,
  isActive: boolean,
  distance: number,
  seller: string,
  businessHours: Array<{ closingTime: string, openingTime: string, dayOfWeek: number }>,
  tagsLabel: any[],
  pickupHolidays: any[],
}

interface LogisticPickupPoint extends CommonPickupPoint {
  name: string,
  address: LogisticAddress,
}

interface ParsedPickupPoint extends CommonPickupPoint {
  friendlyName: string,
  address: ParsedAddress,
}

interface Paging {
  page: number,
  perPage: number,
  total: number,
  pages: number
}

interface LogisticOuput {
  items: LogisticPickupPoint[],
  paging: Paging,
}

const parseLogisticAddress = (logAddress: LogisticAddress, idx: number): ParsedAddress => {
  const { country, location, ...rest } = logAddress
  return {
    ...rest,
    addressId: idx.toString(),
    addressType: 'pickup',
    country: country.acronym,
    geoCoordinates: [location.longitude, location.latitude],
  }
}

const parseItem = (logisticItem: LogisticPickupPoint, idx: number): ParsedPickupPoint => {
  const { address, name, ...rest } = logisticItem
  return {
    ...rest,
    address: parseLogisticAddress(address, idx),
    friendlyName: name,
  }
}

interface PickupPointsArgs {
  lat: string,
  long: string,
  maxDistance: number | undefined,
}

interface ParsedItems {
  items: ParsedPickupPoint[],
  paging: Paging,
}

export const queries = {
  logistics: httpResolver({
    headers: withAuthToken(headers.json),
    method: 'GET',
    url: (account: string) => paths.logisticsConfig(account).shipping,
  }),
  pickupPoints: async (root, args: PickupPointsArgs, context): Promise<ParsedItems> => {
    const { vtex: ioContext, request } = context
    const fullHeader = withAuthToken(headers.json)(ioContext, request.headers.cookie)
    const response = await httpResolver<LogisticOuput>({
      headers: fullHeader,
      method: 'GET',
      url: (account: string, { lat, long, maxDistance = 10 }: PickupPointsArgs) => paths.logisticsConfig(account).pickupPoints(lat, long, maxDistance),
    })(root, args, context)
    const parsedResponse = { ...response, items: (response.items || []).map((item, idx) => parseItem(item, idx)) }
    return parsedResponse
  },
}
