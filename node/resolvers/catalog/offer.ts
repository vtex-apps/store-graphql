import { comparator, filter, gte, head, lte, sort } from 'ramda'
// import { renameKeysWith } from '../../utils';

const InstallmentsCriteria = {
  ALL: 'ALL',
  MAX: 'MAX',
  MIN: 'MIN',
}

export const resolvers = {
  Offer: {
    Installments: ({ Installments }: any, { criteria, rates }: any) => {
      if (criteria === InstallmentsCriteria.ALL) {
        return Installments
      }
      const filteredInstallments = !rates
        ? Installments
        : filter(({ InterestRate }) => !InterestRate, Installments)

      const compareFunc = criteria === InstallmentsCriteria.MAX ? gte : lte
      const byNumberOfInstallments = comparator((previous: any, next) => compareFunc(previous.NumberOfInstallments, next.NumberOfInstallments))
      return [head(sort(byNumberOfInstallments, filteredInstallments))]
    },
    DiscountHighLight: (data: any) => {
      console.log("Olá >>>>>>", data)
      // return map(renameKeysWith('Name'), DiscountHighLight)
    }
  }
}
