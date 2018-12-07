import { headers, withAuthToken } from '../headers'
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

export const fieldResolvers = {
  ...pickupResolvers,
}

export const queries = {
  logistics: httpResolver({
    headers: withAuthToken(headers.json),
    method: 'GET',
    url: (account: string) => paths.logisticsConfig(account).shipping,
  }),
  nearPickupPoints: async (root, args: NearPickupPointsArgs, context) => {
    const { vtex: ioContext, request } = context
    const fullHeader = withAuthToken(headers.json)(ioContext, request.headers.cookie)
    const { lat, long, maxDistance = 50 } = args 
    const url = paths.logisticsConfig(ioContext.account).pickupPoints(lat, long, maxDistance)
    return httpResolver<LogisticOuput>({ headers: fullHeader, method: 'GET', url })(root, args, context)
  },
  pickupPoint: async (root, args, context) => {
    const { vtex: ioContext, request } = context
    const fullHeader = withAuthToken(headers.json)(ioContext, request.headers.cookie)
    const url = paths.logisticsConfig(ioContext.account).pickupById(args.id)
    return httpResolver({ headers: fullHeader, method: 'GET', url })(root, args, context)    
  },
}
