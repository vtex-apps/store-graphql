import { serialize } from 'cookie'

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

export const mutations = {
    initializeSession: async (_, args, config) => {
        const initSession = await makeRequest(_, args, config, paths.session, '{}', 'POST')
        if (initSession.status === '408') {
            throw new ResolverError('ERROR', initSession.data)
        }
        const session = await makeRequest(_, args, config, paths.getSession)
        if (session.status === '408') {
            throw new ResolverError('ERROR', session.data)
        }
        return sessionFields(session.data)
    },

    impersonate: async (_, args, config) => {
        const impersonate = await makeRequest(_, args, config, paths.session, impersonateData(args.email), 'PATCH')
        if (impersonate.status === '408') {
            throw new ResolverError('ERROR', impersonate.data)
        }
        const session = await makeRequest(_, args, config, paths.getSession)
        if (session.status === '408') {
            throw new ResolverError('ERROR', session.data)
        }

        config.response.set('Set-Cookie', serialize(IMPERSONATED_EMAIL, args.email, {
            path: '/',
            maxAge: VTEXID_EXPIRES
        }))
        return sessionFields(session.data)
    },

    depersonify: async (_, args, config) => {
        const depersonify = await makeRequest(_, args, config, paths.session, impersonateData(''), 'PATCH')
        if (depersonify.status === '408') {
            throw new ResolverError('ERROR', depersonify.data)
        }
        config.response.set('Set-Cookie', serialize(IMPERSONATED_EMAIL, '', {
            path: '/',
            maxAge: 0
        }))
        return true
    },
}