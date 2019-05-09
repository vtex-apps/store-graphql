import { Segment } from '@vtex/api'
import { prop } from 'ramda'

const localeFromDefaultSalesChannel = (segment: Segment) =>
  segment.getSegmentByToken(null).then(prop('cultureInfo'))

export const toIOMessage = async (segment: Segment, content: string, id: string) => ({
  content,
  from: await localeFromDefaultSalesChannel(segment),
  id,
})

export const toProductIOMessage = (field: string) => (segment: Segment, content: string, id: string) => toIOMessage(
  segment,
  content,
  `Product-id.${id}::${field}`
)

export const toCategoryIOMessage = (field: string) => (segment: Segment, content: string, id: string) => toIOMessage(
  segment,
  content,
  `Category-id.${id}::${field}`
)

export const toBrandIOMessage = (field: string) => (segment: Segment, content: string, id: string) => toIOMessage(
  segment,
  content,
  `Brand-id.${id}::${field}`
)

export const toFacetIOMessage = (segment: Segment, content: string, id: string) => toIOMessage(
  segment,
  content,
  `SpecificationFilter-id.${id}::${content}`
)
