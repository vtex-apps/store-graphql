import * as cookies from 'cookie'

const appendToCookie = (ctx: Context, extraValue: string) => {
  const {request: { headers: { cookie } }} = ctx
  ctx.request.headers.cookie = `${cookie}; ${extraValue}`
}

const isUserLoggedIn = (ctx: Context) => {
  const { vtex: { account }, headers: {cookie} } = ctx
  const parsedCookie = cookies.parse(cookie)
  return !!parsedCookie[`VtexIdclientAutCookie_${account}`]
}

export { appendToCookie, isUserLoggedIn }
