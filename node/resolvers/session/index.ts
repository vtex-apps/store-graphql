import { serialize } from 'cookie'
import { merge, identity } from 'ramda'

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

// Disclaimer: These queries and mutations assume that vtex_session was passed in cookies.
export const queries = {
  /**
   * Get user session
   * @return Session
   */
  getSession: async (_, args, config) => {
    const { data } = await makeRequest(_, args, config, paths.getSession)
    return sessionFields(data)
  }
}

export const mutations = {
  /**
   * Impersonate a customer and set clientProfileData in OrderForm
   * @param args this mutation receives email and orderFormId
   * @return Session
   */
  impersonate: async (_, args, config) => {
    await makeRequest(_, args, config, paths.session, impersonateData(args.email), 'PATCH')

    config.response.set('Set-Cookie', serialize(IMPERSONATED_EMAIL, args.email, {
      path: '/',
      maxAge: VTEXID_EXPIRES,
      encode: identity
    }))
    const { data } = await makeRequest(_, args, config, paths.getSession)
    return sessionFields(data)
  },

  /**
   * Depersonify a customer and set clientProfileData to anonymous user.
   * @param args this mutation receives orderFormId
   */
  depersonify: async (_, args, config) => {
    await makeRequest(_, args, config, paths.session, impersonateData(''), 'PATCH')

    config.response.set('Set-Cookie', serialize(IMPERSONATED_EMAIL, '', {
      path: '/',
      maxAge: 0
    }))
    return true
  }
}
