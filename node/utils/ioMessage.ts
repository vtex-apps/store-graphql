import { prop } from 'ramda'

export const toIOMessage = async (ctx: Context, str: string) => {
  const {dataSources: {session}} = ctx
  return {
    content: str,
    from: await session.getSegmentData(true).then(prop('cultureInfo')),
  }
}
