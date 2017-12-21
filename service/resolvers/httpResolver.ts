import axios, {AxiosResponse} from 'axios'
import {IOContext} from 'colossus'
import {GraphqlRequestBody} from 'graphql'
import {map, prop} from 'ramda'
import * as parse from 'url-parse'

const defaultMerge = (bodyData, resData) => resData
const removeDomain = (cookie) => cookie.replace(/domain=.+?(;|$)/, '')

export type URLBuilder = (account: string, data: any, root: any) => string

export type DataBuilder = (data: any) => any

export type HeadersBuider = (ioContext: IOContext) => Record<string, string>

export type ResponseMerger = (bodyData: any, responseData: any) => any

export interface HttpResolverOptions {
  method?: string
  url: string | URLBuilder
  data?: any | DataBuilder
  headers?: Record<string, string> | HeadersBuider,
  enableCookies?: boolean,
  secure?: boolean,
  merge?: ResponseMerger
}

export default (options: HttpResolverOptions) => {
  return async (body: GraphqlRequestBody, ioContext: IOContext) => {
    const {secure=false, url, enableCookies, data, method='GET', headers={}, merge=defaultMerge} = options

    const builtUrl = (typeof url === 'function') ? url(ioContext.account, body.data, body.root) : url
    const builtData = (typeof data === 'function') ? data(body.data) : data
    const builtHeaders = (typeof headers === 'function') ? await headers(ioContext) : headers

    const config = {method, url: builtUrl, data: builtData, headers: builtHeaders}
    if (enableCookies && body.cookie) {
      config.headers.cookie = body.cookie
    }
    if (secure) {
      config.headers['X-Vtex-Proxy-To'] = `https://${parse(builtUrl).hostname}`
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
