import { JanusClient } from '@vtex/api'
import parseCookie from 'cookie'

interface VtexIdCookies {
  account: string | null
  id: string | null
}

const SESSION_COOKIE = 'vtex_session'

const routes = {
  base: '/api/sessions',
}

export class Session extends JanusClient {
  /**
   * Get the session data using the given token
   */
  public getSession = async (token: string, items: string[]) => {
    const { data: sessionData, headers } = await this.http.getRaw(routes.base, {
      headers: {
        'Content-Type': 'application/json',
        Cookie: `vtex_session=${token};`,
      },
      metric: 'session-get',
      params: {
        items: items.join(','),
      },
    })

    return {
      sessionData,
      sessionToken: extractSessionCookie(headers) ?? token,
    }
  }

  /**
   * Update the public portion of this session
   */
  public updateSession = (
    key: string,
    value: any,
    items: string[],
    token: any,
    vtexIdCookies: VtexIdCookies
  ) => {
    const data = { public: { [key]: { value } } }
    let cookies = `vtex_session=${token};`

    if (vtexIdCookies.account) {
      cookies += `${vtexIdCookies.account};`
    }

    if (vtexIdCookies.id) {
      cookies += `${vtexIdCookies.id};`
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies,
      },
      metric: 'session-update',
      params: {
        items: items.join(','),
      },
    }

    return this.http.post(routes.base, data, config)
  }
}

function extractSessionCookie(headers: Record<string, string>) {
  for (const setCookie of headers['set-cookie'] ?? []) {
    const parsedCookie = parseCookie.parse(setCookie)
    const sessionCookie = parsedCookie[SESSION_COOKIE]

    if (sessionCookie != null) {
      return sessionCookie
    }
  }

  return null
}
