import { resolvers as pickupResolvers } from './PickupPoint'

import { NearPickupPointsArgs, PickupPointArgs } from './types'

export const fieldResolvers = {
  ...pickupResolvers,
}

export const queries = {
  logistics: (root, _, {dataSources: {logistics}}: Context) => logistics.shipping(),

  nearPickupPoints: (
    root, 
    { lat, long, maxDistance }: NearPickupPointsArgs,
    {dataSources: {logistics}}: Context
    ) => logistics.nearPickupPoints(lat, long, maxDistance),

  pickupPoint: (root, { id }: PickupPointArgs, {dataSources: {logistics}}: Context) => logistics.pickupById(id),
}
