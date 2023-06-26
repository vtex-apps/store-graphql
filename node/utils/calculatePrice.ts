export const calculatePrice = (
  unitMultiplier: number,
  sellingPrice: number,
  price: number
) => {
  const minRange = (sellingPrice * 10 - 1) / (unitMultiplier * 10)
  const maxRange = (sellingPrice * 10 + 9) / (unitMultiplier * 10)

  const ceilMinRange = Math.ceil(minRange)

  // Check if the Price attends the rule for items without discount
  // Avoinding unnecessary calculation

  const realPriceFromPrice = price * unitMultiplier

  if (Math.trunc(realPriceFromPrice) === sellingPrice) {
    return price
  }

  // The real price must always be a number that, when multiplied by the multiplier unit,
  // must generate a value that, when truncated to two decimal places, results in the selling price
  // We try to find a value of two decimal places and if it is not possible, we pull the first value that meets

  const realPrice =
    ceilMinRange < maxRange &&
    ceilMinRange !== minRange &&
    ceilMinRange * unitMultiplier > sellingPrice
      ? ceilMinRange
      : Number(((minRange + maxRange) / 2).toFixed(1))

  return realPrice
}
