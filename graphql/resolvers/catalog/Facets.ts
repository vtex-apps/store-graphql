import {objToNameValue} from './objToNameValue'

export default {
  Facets: {
    SpecificationFilters: (facets) => {
      const {SpecificationFilters={}} = facets
      return objToNameValue('name', 'value', SpecificationFilters)
    }
  },
}
