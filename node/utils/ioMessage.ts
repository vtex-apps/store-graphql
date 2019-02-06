import { Resources } from '../resources'

export const toIOMessage = async (ctx: Context, str: string) => {
  if (!ctx.resources) {
    ctx.resources = new Resources(ctx)
  }
  const {resources: {segment}} = ctx
  return {
    content: str,
    from: await segment.getDefaultSalesChannel(),
  }
}
