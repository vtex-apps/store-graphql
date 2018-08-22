import { serialize, parse } from 'cookie'
import { prop, map, path, filter, concat } from 'ramda'

import paths from '../paths'
import { sessionFields } from './sessionResolver'
import httpResolver from '../httpResolver'
import { withAuthToken, headers } from '../headers'
import ResolverError from '../../errors/resolverError';

const IMPERSONATED_EMAIL = 'vtex-impersonated-customer-email'
// maxAge of 1-day defined in vtex-impersonated-customer-email cookie 
const VTEXID_EXPIRES = 86400

const makeRequest = async (_, args, config, url, data?, method?, enableCookies = true) => {
  return await httpResolver({
    url,
    data,
    method,
    enableCookies,
    headers: withAuthToken(headers.json),
    merge: (bodyData, responseData, response) => {
      return { ...response }
    },
  })(_, args, config)
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

const formatRequestCookie = (key, cookies) => {
  return `;${key}=${map(prop(key), filter(path([key]), cookies)).toString()}`
}

const errorHandler = res => {
  if (res.status > 400) {
    throw new ResolverError('ERROR', res.data)
  }
}

export const mutations = {
  initializeSession: async (_, args, config) => {
    const initSession = await makeRequest(_, args, config, paths.session, '{}', 'POST')
    errorHandler(initSession)
    // Set session cookies to request GET session
    const parsedCookies = map(parse, prop('set-cookie', initSession.headers))
    const sessionCookies = `${formatRequestCookie('vtex_session', parsedCookies)}${formatRequestCookie('vtex_segment', parsedCookies)}`
    config.headers.cookie = concat(config.headers.cookie, sessionCookies)

    const session = await makeRequest(_, args, config, paths.getSession)
    errorHandler(session)

    config.response.set('Set-Cookie', prop('set-cookie', initSession.headers))
    return sessionFields(session.data)
  },

  impersonate: async (_, args, config) => {
    const impersonate = await makeRequest(_, args, config, paths.session, impersonateData(args.email), 'PATCH')
    errorHandler(impersonate)

    const session = await makeRequest(_, args, config, paths.getSession)
    errorHandler(session)

    // const { profile } = merge({ expectedOrderFormSections: ['items'] }, sessionData)
    // console.log(profile)
    // await makeRequest(_, args, config, paths.orderFormProfile )
    config.response.set('Set-Cookie', serialize(IMPERSONATED_EMAIL, args.email, {
      path: '/',
      maxAge: VTEXID_EXPIRES
    }))
    return sessionFields(session.data)
  },

  depersonify: async (_, args, config) => {
    const depersonify = await makeRequest(_, args, config, paths.session, impersonateData(''), 'PATCH')
    errorHandler(depersonify)
    config.response.set('Set-Cookie', serialize(IMPERSONATED_EMAIL, '', {
      path: '/',
      maxAge: 0
    }))
    return true
  }
}
