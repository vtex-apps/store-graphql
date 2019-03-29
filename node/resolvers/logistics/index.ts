import { resolvers as pickupResolvers } from './PickupPoint'

import { NearPickupPointsArgs, PickupPointArgs } from './types'

export const fieldResolvers = {
  ...pickupResolvers,
}

export const queries = {
  logistics: (_: any, __: any, {dataSources: {logistics}}: Context) => logistics.shipping(),

  nearPickupPoints: (
    _: any,
    { lat, long, maxDistance }: NearPickupPointsArgs,
    {dataSources: {logistics}}: Context
    ) => logistics.nearPickupPoints(lat, long, maxDistance),

  pickupPoint: (_: any, { id }: PickupPointArgs, {dataSources: {logistics}}: Context) => logistics.pickupById(id),
}
