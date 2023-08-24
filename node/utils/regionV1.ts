export function isRegionV1(regionId: string) {
  const regex = /v\d+/

  return !regex.test(regionId)
}

export function isUniqueSeller(regionId: string) {
  return !regionId.includes(';')
}
