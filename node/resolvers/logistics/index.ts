import { headers, withAuthAsVTEXID, withAuthToken  } from '../headers'
import httpResolver from '../httpResolver'
import paths from '../paths'
import { resolvers as pickupResolvers } from './PickupPoint'

interface LogisticAddress {
  country: { acronym: string, name: string },
  location: { latitude: number, longitude: number },
  postalCode: string,
  city: string,
  state: string,
  neighborhood: string,
  street: string,
  number: string,
  complement: string,
  reference: string,
} 

export interface LogisticPickupPoint {
  name: string,
  address: LogisticAddress,
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

interface NearPickupPointsArgs {
  lat: string,
  long: string,
  maxDistance: number | undefined,
}

interface PickupPointArgs {
  id: string,
}

export const fieldResolvers = {
  ...pickupResolvers,
}

export const queries = {
  logistics: httpResolver({
    headers: withAuthToken(headers.json),
    method: 'GET',
    url: (account: string) => paths.logisticsConfig(account).shipping,
  }),
  nearPickupPoints: httpResolver<LogisticOuput>({
    headers: withAuthAsVTEXID(headers.json),
    method: 'GET',
    url: (account: string, { lat, long, maxDistance = 50 }: NearPickupPointsArgs) => paths.logisticsConfig(account).pickupPoints(lat, long, maxDistance)
  }),
  pickupPoint: httpResolver<LogisticPickupPoint>({
    headers: withAuthAsVTEXID(headers.json),
    method: 'GET',
    url: (account: string, { id }: PickupPointArgs) => paths.logisticsConfig(account).pickupById(id)
  }),
}
