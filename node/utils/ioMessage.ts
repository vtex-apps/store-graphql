import { Segment } from '@vtex/api'
import { prop } from 'ramda'
import { extractSlug } from '../resolvers/catalog';

const localeFromDefaultSalesChannel = (segment: Segment) =>
  segment.getSegmentByToken(null).then(prop('cultureInfo'))

export const toIOMessage = async (segment: Segment, content: string, id: string) => ({
  content,
  from: await localeFromDefaultSalesChannel(segment),
  id,
})

export const toProductIOMessage = (field: string) => async (segment: Segment, content: string, link: string) => toIOMessage(
  segment,
  content,
  `slug.${extractSlug({href: link})}::Product-${field}`
)

export const toCategoryIOMessage = (field: string) => async (segment: Segment, content: string, id: string) => toIOMessage(
  segment,
  content,
  `id.${id}::Category-${field}`
)
