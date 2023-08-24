import { regionFlag } from './regionFlag'

export function isSellerFlaggedForChangingOnSimulationBasedOnRegion(
  sellerName: string
) {
  return regionFlag.includes(sellerName)
}
