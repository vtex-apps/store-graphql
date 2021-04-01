import { UAParser } from 'ua-parser-js'

import { LoginSession, LoginAccess, DeviceType } from './types'

const getLastAccessDateFromHistory = (history: LoginAccess[]) => {
  if (history && history.length > 0) {
    const epochSeconds = history[history.length - 1].date

    return new Date(epochSeconds * 1000).toISOString()
  }

  return null
}

const deviceTypeByParserType: Record<string, DeviceType> = {
  console: 'DESKTOP',
  mobile: 'MOBILE',
  tablet: 'TABLET',
  smarttv: 'DESKTOP',
  wearable: 'MOBILE',
  embedded: 'DESKTOP',
}

const parseUserAgent = (userAgent: string) => {
  const parser = new UAParser(userAgent)
  const { name: browser = null } = parser.getBrowser()
  const { name: os = null } = parser.getOS()
  const { type: parserType } = parser.getDevice()

  const deviceType: DeviceType = parserType
    ? deviceTypeByParserType[parserType]
    : 'DESKTOP'

  return {
    browser,
    os,
    deviceType,
  }
}

const mapLoginSessionsFromAPI = (loginSessions: LoginSession[]) =>
  loginSessions.map((session) => {
    const { browser, os, deviceType } = parseUserAgent(session.userAgent)

    return {
      id: session.id,
      cacheId: session.id,
      deviceType,
      city: null,
      lastAccess: getLastAccessDateFromHistory(session.accessHistory),
      browser,
      os,
      ip: session.ipAddress,
      fullAddress: null,
      firstAccess: session.creationDate,
    }
  })

export default mapLoginSessionsFromAPI
