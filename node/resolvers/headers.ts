import * as cookies from 'cookie'

const DEFAULT_PAGE_SIZE = 15

export const headers = {
  json: {
    accept: 'application/json',
    'content-type': 'application/json',
  },
  profile: {
    accept: 'application/vnd.vtex.ds.v10+json',
    'content-type': 'application/json',
  },
}

export const withAuthToken = (currentHeaders = {}) => (ioContext, cookie = null) => {
  let VtexIdclientAutCookie
  let ans = {...currentHeaders}
  if (cookie) {
    const parsedCookie = cookies.parse(cookie)
    ans['VtexIdclientAutCookie'] = parsedCookie.VtexIdclientAutCookie
  }
  return {
    ...ans,
    Authorization: `${ioContext.authToken}`,
    'Proxy-Authorization': `${ioContext.authToken}`
  }
}

export const withMDPagination = (currentHeaders = {}) => (ioContext, cookie = null) => (start = 0, pageSize = DEFAULT_PAGE_SIZE) => {
  return {
    ...(withAuthToken(currentHeaders)(ioContext, cookie)),
    'REST-Range': `resources=${start}-${start+pageSize}`
  }
}