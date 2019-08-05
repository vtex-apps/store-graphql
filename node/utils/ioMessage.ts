import { Segment } from '@vtex/api'
import { prop } from 'ramda'

import { Slugify } from '../resolvers/catalog/slug'

export const localeFromDefaultSalesChannel = (segment: Segment) =>
  segment.getSegmentByToken(null).then(prop('cultureInfo'))

export const toSearchTerm = (term: string, from: string, description: string = '') => ({
  id: `Search::${Slugify(term)}`,
  description,
  content: term,
  from,
})

export const toProductProvider = (id: string) => `Product-id.${id}`
export const toBrandProvider = (id: string|number) => `Brand-id.${id}`
export const toCategoryProvider = (id: number | string) => `Category-id.${id}`
export const toFacetProvider = (id: number) => `SpecificationFilter-id.${id}`
export const toClusterProvider = (id: string) => `ProductCluster-id.${id}`
