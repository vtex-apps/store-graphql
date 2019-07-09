import { resolvers as pickupResolvers } from './PickupPoint'

import { NearPickupPointsArgs, PickupPointArgs } from './types'

export const fieldResolvers = {
  ...pickupResolvers,
}

export const queries = {
  logistics: (_: any, __: any, { clients: { logistics } }: Context) =>
    logistics.shipping(),

  nearPickupPoints: (
    _: any,
    { lat, long, maxDistance }: NearPickupPointsArgs,
    { clients: { logistics } }: Context
  ) => logistics.nearPickupPoints(lat, long, maxDistance),

  pickupPoint: (
    _: any,
    { id }: PickupPointArgs,
    { clients: { logistics } }: Context
  ) => logistics.pickupById(id),
}
