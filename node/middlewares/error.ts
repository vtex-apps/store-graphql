export default async function extract(ctx: Context, next: () => Promise<void>) {
  try {
    await next()
  } catch (err) {
    if (err.isGraphQLError) {
      ctx.body = err.message
      ctx.status = err.statusCode

      Object.entries(err.headers).forEach(([key, value]) => {
        ctx.set(key, value as any)
      })

      return
    }

    throw err
  }
}
