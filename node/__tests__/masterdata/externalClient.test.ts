jest.mock('@vtex/api/lib/clients/IOClient', () => ({
  IOClient: class {
    public context: unknown
    public options: unknown
    constructor(context: unknown, options: unknown) {
      this.context = context
      this.options = options
    }
  },
}))

jest.mock('@vtex/api', () => ({
  ...jest.requireActual('../../__mocks__/@vtex/api'),
  ExternalClient: jest.requireActual(
    '@vtex/api/lib/clients/external/ExternalClient'
  ).ExternalClient,
}))

import { MasterData } from '../../clients/masterdata'

const createClient = (extra: Record<string, unknown> = {}) =>
  new MasterData({
    account: 'store',
    workspace: 'master',
    authToken: 'APP_TOKEN',
    region: 'aws-us-east-1',
    production: false,
    product: 'io',
    userAgent: 'test',
    requestId: 'r',
    operationId: 'o',
    platform: 'vtex',
    logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
    ...extra,
  } as any)

const headersOf = (client: MasterData) => (client as any).options.headers

describe('MasterData with the real ExternalClient', () => {
  it('sends the app token only as Proxy-Authorization, never as a user credential', () => {
    const headers = headersOf(createClient())

    expect(headers['Proxy-Authorization']).toBe('APP_TOKEN')
    expect(headers.VtexIdclientAutCookie).toBeUndefined()
    expect(
      JSON.stringify({ ...headers, 'Proxy-Authorization': undefined })
    ).not.toContain('APP_TOKEN')
  })

  it.each([
    ['storeUserAuthToken', 'SHOPPER'],
    ['adminUserAuthToken', 'ADMIN'],
  ])('sends the %s as the user cookie', (key, token) => {
    const headers = headersOf(createClient({ [key]: token }))

    expect(headers.VtexIdclientAutCookie).toBe(token)
    expect(headers['Proxy-Authorization']).toBe('APP_TOKEN')
  })
})
