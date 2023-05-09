import { parse } from 'set-cookie-parser'
import { SetOption } from 'cookies'

const isUserLoggedIn = (ctx: Context) => {
  const {
    vtex: { account },
  } = ctx

  return !!ctx.cookies.get(`VtexIdclientAutCookie_${account}`)
}

const parseCookie = (cookie: string): ParsedCookie => {
  const [parsed] = parse(cookie)

  const cookieName = parsed.name
  const cookieValue = parsed.value

  const extraOptions = {
    path: parsed.path,
    domain: parsed.domain,
    expires: parsed.expires,
    httpOnly: true,
    secure: parsed.secure,
    sameSite: parsed.sameSite as 'strict' | 'lax' | undefined,
  }

  return {
    name: cookieName,
    value: cookieValue,
    options: extraOptions,
  }
}

/** Checkout cookie methods */
const CHECKOUT_COOKIE = 'checkout.vtex.com'
const ASPXAUTH_COOKIE = '.ASPXAUTH'
const OWNERSHIP_COOKIE = 'CheckoutOrderFormOwnership'

const checkoutCookieFormat = (orderFormId: string) =>
  `${CHECKOUT_COOKIE}=__ofid=${orderFormId};`

export function ownershipCookieFormat(ownerId: string) {
  return `${OWNERSHIP_COOKIE}=${ownerId};`
}

const getOrderFormIdFromCookie = (cookies: Context['cookies']) => {
  const cookie = cookies.get(CHECKOUT_COOKIE)

  return cookie?.split('=')[1]
}

export function getOwnerIdFromCookie(cookies: Context['cookies']) {
  return cookies.get(OWNERSHIP_COOKIE)
}

export {
  isUserLoggedIn,
  CHECKOUT_COOKIE,
  ASPXAUTH_COOKIE,
  OWNERSHIP_COOKIE,
  checkoutCookieFormat,
  getOrderFormIdFromCookie,
  parseCookie,
}

interface ParsedCookie {
  name: string
  value: string
  options: SetOption
}
