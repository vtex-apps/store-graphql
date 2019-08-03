import { Segment } from '@vtex/api'
import { prop } from 'ramda'

import { Slugify } from '../resolvers/catalog/slug'

const localeFromDefaultSalesChannel = (segment: Segment) =>
  segment.getSegmentByToken(null).then(prop('cultureInfo'))

export const toIOMessage = async (field: string, segment: Segment, content: string, vrn: string) =>  {
  const id = field? `${vrn}::${field}` : vrn
  return {
    content,
    from: await localeFromDefaultSalesChannel(segment),
    id: id,
  }
}
export const toSearchTerm = (term: string, from: string, description: string = '') => ({
  id: `Search::${Slugify(term)}`,
  description,
  content: term,
  from,
})

export const toSkuProvider = (id: string) => `SKU-id.${id}`
export const toProductProvider = (id: string) => `Product-id.${id}`
export const toBrandProvider = (id: string|number) => `Brand-id.${id}`
export const toCategoryProvider = (id: number | string) => `Category-id.${id}`
export const toFacetProvider = (id: number) => `SpecificationFilter-id.${id}`
export const toClusterProvider = (id: string) => `ProductCluster-id.${id}`
