
import http from 'axios'

import { parse, serialize } from 'cookie'
// import { withAuthToken } from '../headers'
import paths from '../paths'

const makeRequest = async (ctx, url, headers, data?, method = 'GET') => {
    console.log('>>>>>>>> ', setHeaders(headers, ctx))
    const configRequest = async (ctx, url, data) => ({
        enableCookies: true,
        headers: setHeaders(headers, ctx),
        method,
        url,
        data,
    })
    return await http.request(await configRequest(ctx, url, data))
}

const setHeaders = (currentHeaders, ioContext) => {
    let parsedCookie
    if (currentHeaders.cookie) {
        parsedCookie = parse(currentHeaders.cookie)
    }
    return {
        ...currentHeaders,
        ...parsedCookie.VtexIdclientAutCookie,
        Authorization: `${ioContext.authToken}`,
        'Proxy-Authorization': `${ioContext.authToken}`
    }
}
export const mutations = {
    initializeSession: async (_, args, { vtex: ioContext, request: { headers }, response }, ) => {
        const data = await makeRequest(ioContext, paths.session(ioContext.account), headers, '{}', 'PATCH')
        const session = await makeRequest(ioContext, paths.getSession(ioContext.account), headers)
    },
}