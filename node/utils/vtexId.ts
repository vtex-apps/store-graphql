const vtexIdAccount = (account: string) => `VtexIdclientAutCookie_${account}`
const VTEX_ID = 'VtexIdclientAutCookie'

export const vtexIdCookies = (ctx: Context) => {
  const {
    cookies,
    vtex: { account },
  } = ctx

  const vtexIdAccountCookieValue = cookies.get(vtexIdAccount(account))
  const vtexIdValue = cookies.get(VTEX_ID)

  return {
    account: vtexIdAccountCookieValue
      ? `${vtexIdAccount(account)}=${vtexIdAccountCookieValue}`
      : null,
    id: vtexIdValue ? `${VTEX_ID}=${vtexIdValue}` : null,
  }
}
