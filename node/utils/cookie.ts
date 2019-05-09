import * as Cookies from "cookies"

const isUserLoggedIn = (ctx: Context) => {
  const { vtex: { account } } = ctx
  return !!ctx.cookies.get(`VtexIdclientAutCookie_${account}`)
}

/** Checkout cookie methods */
const CHECKOUT_COOKIE = 'checkout.vtex.com'

const checkoutCookieFormat = (orderFormId: string) => `${CHECKOUT_COOKIE}=__ofid=${orderFormId};`

const getOrderFormIdFromCookie = (cookies: Cookies) => {
  const cookie = cookies.get(CHECKOUT_COOKIE)
  return cookie && cookie.split('=')[1]
}

export { isUserLoggedIn, CHECKOUT_COOKIE, checkoutCookieFormat, getOrderFormIdFromCookie }
