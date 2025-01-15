/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
  Disabling because `status` and `body` are not defined in the `Context` type provided by VTEX.
  However, they are dynamically added by the middleware in the runtime, and using them works as expected.
*/
export async function getEmailRetificationConfig(
  ctx: Context,
  next: () => Promise<any>
) {
  try {
    const { storeUserAuthToken } = ctx.vtex
    const userStoreToken = storeUserAuthToken?.includes('.')
      ? storeUserAuthToken.split('.')[1]
      : ''

    const { account } = JSON.parse(
      Buffer.from(userStoreToken, 'base64').toString()
    )

    if (account !== ctx.vtex.account) {
      setForbiddenStatus(ctx)

      return
    }
  } catch (e) {
    setForbiddenStatus(ctx)

    return
  }

  // @ts-ignore
  ctx.status = 200
  // @ts-ignore
  ctx.body = await ctx.clients.oms.getEmailRetificationConfig()

  await next()
}

function setForbiddenStatus(ctx: Context) {
  // @ts-ignore
  ctx.status = 403
  // @ts-ignore
  ctx.body = 'Forbidden'
}
