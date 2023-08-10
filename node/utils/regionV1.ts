export function isRegionV1(regionId: string) {
  return !regionId.includes('v2')
}

export function isUniqueSeller(regionId: string) {
  return !regionId.includes(';')
}
