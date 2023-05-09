import { gte, lte, propOr } from 'ramda'

const InstallmentsCriteria = {
  ALL: 'ALL',
  MAX: 'MAX',
  MIN: 'MIN',
}

export const resolvers = {
  Offer: {
    Installments: (
      { Installments }: any,
      { criteria, rates }: { criteria?: string; rates?: boolean }
    ) => {
      if (criteria === InstallmentsCriteria.ALL || Installments.length === 0) {
        return Installments
      }

      const filteredInstallments = !rates
        ? Installments
        : Installments.filter(({ InterestRate }: any) => !InterestRate)

      const compareFunc = criteria === InstallmentsCriteria.MAX ? gte : lte
      const value = filteredInstallments.reduce(
        (acc: any, currentValue: any) =>
          compareFunc(
            currentValue.NumberOfInstallments,
            acc.NumberOfInstallments
          )
            ? currentValue
            : acc,
        filteredInstallments[0]
      )

      return [value]
    },
    teasers: propOr([], 'Teasers'),
    giftSkuIds: propOr([], 'GiftSkuIds'),
    discountHighlights: propOr([], 'DiscountHighLight'),
    spotPrice: (offer: Seller['commertialOffer']) => {
      const sellingPrice = offer.Price
      const spotPrice: number | undefined = offer.Installments.find(
        ({ NumberOfInstallments, Value }) => {
          return NumberOfInstallments === 1 && Value < sellingPrice
        }
      )?.Value

      return spotPrice ?? sellingPrice
    },
  },
}
