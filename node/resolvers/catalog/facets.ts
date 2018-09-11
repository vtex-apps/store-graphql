import { map, toPairs } from 'ramda'

const objToNameValue = (keyName: string, valueName: string, record: Record<string, any>) => map(
  ([key, value]) => ({ [keyName]: key, [valueName]: value }),
  toPairs(record)
)

export const resolvers = {
  Facets: {
    SpecificationFilters: ({SpecificationFilters = {}}) => objToNameValue('name', 'facets', SpecificationFilters),
  }
}
