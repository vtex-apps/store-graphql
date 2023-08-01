import { calculatePrice } from '../../utils/calculatePrice'
import prices from '../../__mocks__/calculatePrice'

describe('calculatePrice', () => {
  prices.forEach((priceObj) => {
    const { calculatedSellingPrice, unitMultiplier, price } = priceObj

    calculatedSellingPrice.forEach((sellingPrice) => {
      unitMultiplier.forEach((multiplier) => {
        it(`should calculate the correct real price with sellingPrice ${sellingPrice} and unitMultiplier ${multiplier} and`, () => {
          const realPrice = calculatePrice(multiplier, sellingPrice, price)
          const formatRealPrice = Number((realPrice / 100).toFixed(3))
          const realSellingPrice = Math.floor(
            formatRealPrice * multiplier * 100
          )

          expect(realSellingPrice).toBe(sellingPrice)
        })
      })
    })
  })
})
