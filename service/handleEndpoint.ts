import axios from 'axios'
import {prop, map} from 'ramda'

const defaultMerge = (bodyData, resData) => resData
const removeDomain = (cookie) => cookie.replace(/domain=.+?(;|$)/, '')

export default (
    {method = 'GET', url, data = null, headers = {}, enableCookies = false, merge = defaultMerge}:
    {method?: string, url?: any, data?: any, headers?: any, enableCookies?: boolean, merge?: Function}
  ) => {
  return async (body, ctx, req) => {
    const builtUrl = (typeof url === 'function') ? url(ctx.account, body.data, body.root) : url
    const builtData = (typeof data === 'function') ? data(body.data) : data
    const builtHeaders = (typeof headers === 'function') ? await headers(req, ctx) : headers

    const config = {method, url: builtUrl, data: builtData, headers: builtHeaders}
    if (enableCookies && body.cookie) {
      config.headers.cookie = body.cookie
    }

    const vtexResponse = await axios.request(config)
    let cookie
    if (enableCookies) {
      const setCookie = prop('set-cookie', vtexResponse.headers)
      if (setCookie) {
        cookie = map(removeDomain, setCookie)
      }
    }
    return {cookie, data: merge(body.data, vtexResponse.data)}
  }
}
