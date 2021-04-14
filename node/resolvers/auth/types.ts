export interface LoginAccess {
  date: number
  ip: string
}

export interface LoginSession {
  id: string
  creationDate: string
  expirationDate: string
  originHostname: string
  ipAddress: string
  userAgent: string
  accessHistory: LoginAccess[]
}

export interface GetLoginSessionsResponse {
  currentSessionId: string | null
  sessions: LoginSession[]
}

export type DeviceType = 'MOBILE' | 'TABLET' | 'DESKTOP'
