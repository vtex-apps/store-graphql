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
    const { account } = decodeToken(storeUserAuthToken ?? '')

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

function decodeToken(token: string) {
  if (!token || !token.includes('.')) {
    throw new Error('Invalid token')
  }

  const [, encodedPayload] = token.split('.')
  const payload = Buffer.from(encodedPayload, 'base64').toString()

  return JSON.parse(payload)
}

function setForbiddenStatus(ctx: Context) {
  // @ts-ignore
  ctx.status = 403
  // @ts-ignore
  ctx.body = 'Forbidden'
}
