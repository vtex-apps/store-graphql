import { Segment } from '@vtex/api'
import { prop } from 'ramda'

const localeFromDefaultSalesChannel = (segment: Segment) =>
  segment.getSegmentByToken(null).then(prop('cultureInfo'))

export const toIOMessage = async (ctx: Context, content: string, id: string) => {
  const { clients: { segment } } = ctx
  return {
    content,
    from: await localeFromDefaultSalesChannel(segment),
    id,
  }
}
