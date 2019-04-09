import { prop } from 'ramda'

export const toIOMessage = async (ctx: Context, str: string, id: string) => {
  const { clients: { segment } } = ctx
  return {
    content: str,
    from: await segment.getSegment().then(prop('cultureInfo')),
    id,
  }
}
