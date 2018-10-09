import {comparator, filter, gte, head, lte, sort} from 'ramda'

const InstallmentsCriteria = {
  ALL: 'ALL',
  MAX: 'MAX',
  MIN: 'MIN',
}

export const resolvers = {
  Offer: {
    Installments: ({Installments}, args, __) => {
      const {criteria, rates} = args
      if (criteria === InstallmentsCriteria.ALL) {
        return Installments
      }
      const filteredInstallments = !rates
        ? Installments
        : filter(({InterestRate}) => !InterestRate, Installments)

      const compareFunc = criteria === InstallmentsCriteria.MAX ? gte : lte
      const byNumberOfInstallments = comparator((previous: any, next) => compareFunc(previous.NumberOfInstallments, next.NumberOfInstallments))
      return [head(sort(byNumberOfInstallments, filteredInstallments))]
    },
  }
}
