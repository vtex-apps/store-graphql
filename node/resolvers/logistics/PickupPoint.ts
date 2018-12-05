import { LogisticPickupPoint } from './index'

export const resolvers = {
  PickupPoint: {
    address: ({ id, address: logAddress }: LogisticPickupPoint) => {
      const { country, location, ...rest } = logAddress
      return {
        ...rest,
        addressId: id,
        addressType: 'pickup',
        country: country.acronym,
        geoCoordinates: [location.longitude, location.latitude],
      }
    },
    friendlyName: ({ name }: LogisticPickupPoint) => name,
  }
}