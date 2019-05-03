import { Segment } from '@vtex/api'
import { prop } from 'ramda'

const localeFromDefaultSalesChannel = (segment: Segment) =>
  segment.getSegmentByToken(null).then(prop('cultureInfo'))

export const toIOMessage = async (segment: Segment, content: string, id: string) => ({
  content,
  from: await localeFromDefaultSalesChannel(segment),
  id,
})
