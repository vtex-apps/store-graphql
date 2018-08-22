import { serialize, parse } from 'cookie'
import { prop, map, path, filter, concat, merge } from 'ramda'

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

const impersonateData = email => {
  return {
    public: {
      "vtex-impersonated-customer-email": {
        value: email
      }
    }
  }
}

// Set session cookies to request GET session
const formatRequestCookie = (cookies) => {
  const sessionKey = ['vtex_session', 'vtex_segment']
  const formatCookie = key => `;${key}=${map(prop(key), filter(path([key]), map(parse, prop('set-cookie', cookies)))).toString()}`
  return sessionKey.reduce((ac, element) => ac + formatCookie(element), '')
}

export const mutations = {
  initializeSession: async (_, args, config) => {
    const { headers } = await makeRequest(_, args, config, paths.session, '{}', 'POST')
    config.headers.cookie = concat(config.headers.cookie, formatRequestCookie(headers))

    const session = await makeRequest(_, args, config, paths.getSession)

    config.response.set('Set-Cookie', prop('set-cookie', headers))
    return sessionFields(session.data)
  },

  impersonate: async (_, args, config) => {
    const { headers } = await makeRequest(_, args, config, paths.session, impersonateData(args.email), 'PATCH')
    config.headers.cookie = concat(config.headers.cookie, formatRequestCookie(headers))

    const session = await makeRequest(_, args, config, paths.getSession)

    const { profile } = merge({ expectedOrderFormSections: ['items'] }, sessionFields(session.data))
    await makeRequest(_, args, config, paths.orderFormProfile, profile, 'POST')

    config.response.set('Set-Cookie', serialize(IMPERSONATED_EMAIL, args.email, {
      path: '/',
      maxAge: VTEXID_EXPIRES
    }))
    return sessionFields(session.data)
  },

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
