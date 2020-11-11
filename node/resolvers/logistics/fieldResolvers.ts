import { prop } from 'ramda'

import { LogisticPickupPoint } from './types'
import { SalesChannel } from '../../clients/portal'

export default {
  LogisticsData: {
    shipsTo: async (obj: any, __: any, context: Context) => {
      if (!obj || !obj.shipsTo || obj.shipsTo.length === 0) {
        const defaultSalesChannelCountry = prop(
          'CountryCode',
          (await context.clients.portal.defaultSalesChannel()) as SalesChannel
        )

        return [defaultSalesChannelCountry]
      }

      return obj.shipsTo
    },
  },
  PickupPoint: {
    address: ({ id, address: logAddress }: LogisticPickupPoint) => {
      const { country, location, ...rest } = logAddress

      return {
        ...rest,
        receiverName: null,
        addressId: id,
        addressType: 'pickup',
        country: country.acronym,
        geoCoordinate: [location.longitude, location.latitude],
        id,
      }
    },
    friendlyName: ({ name }: LogisticPickupPoint) => name,
  },
}
