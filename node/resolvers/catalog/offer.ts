import { comparator, filter, gte, head, lte, sort, map } from 'ramda'
import { renameKeys } from '../../utils'

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
    discountHighLights: ({ DiscountHighLight }: any) => {
      return map(renameKeys({ '<Name>k__BackingField': 'name' }), DiscountHighLight)
    }
  }
}
