import { serialize, parse } from 'cookie'
import { prop, concat, merge, identity, map, filter, path } from 'ramda'

import paths from '../paths'
import { sessionFields } from './sessionResolver'
import httpResolver from '../httpResolver'
import { withAuthToken, headers } from '../headers'
import ResolverError from '../../errors/resolverError';

const IMPERSONATED_EMAIL = 'vtex-impersonated-customer-email'
// maxAge of 1-day defined in vtex-impersonated-customer-email cookie 
const VTEXID_EXPIRES = 86400

const makeRequest = async (_, args, config, url, data?, method?, enableCookies = true) => {
  const response = await httpResolver({
    url,
    data,
    method,
    enableCookies,
    headers: withAuthToken(headers.json),
    merge: (bodyData, responseData, response) => {
      return { ...response }
    },
  })(_, args, config)
  if (response.status > 400) {
    throw new ResolverError('ERROR', response.data)
  }
  return response
}

// Object that will be passed in data of impersonate and depersonify requests
const impersonateData = email => {
  return {
    public: {
      "vtex-impersonated-customer-email": {
        value: email
      }
    }
  }
}

/** 
 * Parse session set-cookie array to cookie request format. 
 * @param cookies
 * @return parsedCookies
*/
export const parseResponseCookies = resCookies => {
  const sessionKey = ['vtex_session', 'vtex_segment']
  const formatCookie = key => `;${key}=${map(prop(key), filter(path([key]), map(parse, prop('set-cookie', resCookies)))).toString()}`
  return sessionKey.reduce((ac, element) => ac + formatCookie(element), '')
}

export const mutations = {
  /**
   * Initialize user session and set vtex_session and vtex_segment cookies
   * @return Session
   */
  initializeSession: async (_, args, config) => {
    const { headers } = await makeRequest(_, args, config, paths.session, '{}', 'POST')
    config.headers.cookie = concat(config.headers.cookie, parseResponseCookies(headers))

    const session = await makeRequest(_, args, config, paths.getSession)

    config.response.set('Set-Cookie', prop('set-cookie', headers))
    return sessionFields(session.data)
  },

  /**
   * Impersonate a customer and set clientProfileData in OrderForm
   * @param args this mutation receives email and orderFormId
   * @return Session
   */
  impersonate: async (_, args, config) => {
    const { headers } = await makeRequest(_, args, config, paths.session, impersonateData(args.email), 'PATCH')
    config.headers.cookie = concat(config.headers.cookie, parseResponseCookies(headers))

    const session = await makeRequest(_, args, config, paths.getSession)

    const { profile } = merge({ expectedOrderFormSections: ['items'] }, sessionFields(session.data))
    await makeRequest(_, args, config, paths.orderFormProfile, profile, 'POST')

    config.response.set('Set-Cookie', serialize(IMPERSONATED_EMAIL, args.email, {
      path: '/',
      maxAge: VTEXID_EXPIRES,
      encode: identity
    }))
    return sessionFields(session.data)
  },

  /**
   * Depersonify a customer and set clientProfileData to anonymous user.
   * @param args this mutation receives orderFormId
   */
  depersonify: async (_, args, config) => {
    await makeRequest(_, args, config, paths.session, impersonateData(''), 'PATCH')
    await makeRequest(_, args, config, paths.changeToAnonymousUser)

    config.response.set('Set-Cookie', serialize(IMPERSONATED_EMAIL, '', {
      path: '/',
      maxAge: 0
    }))
    return true
  }
}
