import { IOContext } from '@vtex/api'
import axios, { Method } from 'axios'
import { prop } from 'ramda'
import parse from 'url-parse'

const defaultMerge = (_: any, resData: any, __: any) => resData

export type URLBuilder = (account: string, data: any, root: any) => string

export type DataBuilder = (data: any) => any

export type HeadersBuider = (ioContext: IOContext) => Record<string, string>

export type ResponseMerger = (
  bodyData: any,
  responseData: any,
  response?: any
) => any

export interface HttpResolverOptions {
  method?: Method
  url: string | URLBuilder
  data?: any | DataBuilder
  headers?: Record<string, string> | HeadersBuider
  enableCookies?: boolean
  secure?: boolean
  merge?: ResponseMerger
}

export type HttpResolver<T> = (
  root: any,
  args: any,
  context: Context
) => Promise<T>

export default <T = any>(options: HttpResolverOptions): HttpResolver<T> => {
  return async (
    root,
    args,
    {
      vtex: ioContext,
      request: {
        headers: { cookie, 'x-forwarded-host': host },
      },
      response,
    }: Context
  ) => {
    const {
      secure = false,
      url,
      enableCookies,
      data,
      method = 'GET',
      headers = {},
      merge = defaultMerge,
    } = options

    const builtUrl =
      typeof url === 'function' ? url(ioContext.account, args, root) : url

    const builtData = typeof data === 'function' ? data(args) : data
    const builtHeaders =
      typeof headers === 'function' ? await headers(ioContext) : headers

    const config = {
      method,
      url: builtUrl,
      data: builtData,
      headers: builtHeaders,
    }

    if (enableCookies && cookie) {
      config.headers.cookie = cookie
      config.headers.host = host
    }

    const { hostname } = parse(builtUrl)

    if (secure) {
      config.headers['X-Vtex-Proxy-To'] = `https://${hostname}`
    } else if (enableCookies && cookie) {
      config.headers['X-Vtex-Proxy-To'] = `http://${hostname}`
    }

    const vtexResponse = await axios.request(config)

    if (enableCookies) {
      const setCookie = prop('set-cookie', vtexResponse.headers)

      if (setCookie) {
        response.set('Set-Cookie', setCookie)
      }
    }

    return merge(args, vtexResponse.data, vtexResponse)
  }
}
