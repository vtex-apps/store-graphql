import { NearPickupPointsArgs, PickupPointArgs } from './types'
import fieldR from './fieldResolvers'

export const fieldResolvers = fieldR

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
