import { prop, map, path } from 'ramda'
import axios from 'axios'

axios.interceptors.response.use(response => response, function (error) {
  if (error.response) {
    console.log('External request failed.', { status: error.response.status, url: error.config.url })
  }
  throw error
})

const removeDomain = (cookie) => cookie.replace(/domain=.+?(;|$)/, '')

export default ({method = 'GET', url, data, headers = {}, enableCookies, callback}) => {
  return async (root, args, ctx) => {
    const builtUrl = (typeof url === 'function') ? url(root, args, ctx) : url
    const builtData = (typeof data === 'function') ? data(root, args) : data
    const builtHeaders = (typeof headers === 'function') ? headers(ctx) : headers

    const config = { method, url: builtUrl, data: builtData, headers: builtHeaders }
    if (enableCookies) {
      const cookie = path(['req', 'headers', 'cookie'], ctx)
      if (cookie) {
        config.headers.cookie = cookie
      }
    }

    const response = await axios.request(config)
    if (enableCookies) {
      const setCookie = prop('set-cookie', response.headers)
      if (setCookie) {
        ctx.res.setHeader('Set-Cookie', map(removeDomain, setCookie))
      }
    }

    return callback
      ? callback(args, response.data)
      : response.data
  }
}
