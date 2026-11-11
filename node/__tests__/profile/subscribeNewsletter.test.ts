import { mutations } from '../../resolvers/profile'

jest.mock('@vtex/api', () => ({
  UserInputError: class UserInputError extends Error {},
}))

const { UserInputError } = jest.requireMock('@vtex/api')

const getProfileInfo = jest.fn()
const updatePersonalPreferences = jest.fn()
const getUserWithToken = jest.fn()
const getCurrentAccount = jest.fn()

;(global as any).diagnosticsMetrics = { incrementCounter: jest.fn() }

function createContext(storeUserAuthToken?: string) {
  return {
    clients: {
      profile: { getProfileInfo, updatePersonalPreferences },
      identity: { getUserWithToken },
      licenseManagerExtended: { getCurrentAccount },
    },
    vtex: {
      account: 'store',
      storeUserAuthToken,
      logger: { warn: jest.fn() },
    },
  } as any
}

const subscribe = (email: any, context = createContext()) =>
  mutations.subscribeNewsletter(
    null,
    { email, isNewsletterOptIn: true },
    context
  )

const httpError = (status: number) =>
  Object.assign(new Error('http'), { response: { status } })

const wrapped = (
  error: Error,
  status: number,
  code: string,
  name = 'UserInputError'
) => Object.assign(error, { name, status, code, response: { status } })

beforeEach(() => {
  jest.clearAllMocks()
  updatePersonalPreferences.mockResolvedValue(undefined)
  getUserWithToken.mockResolvedValue({ authStatus: '' })
  getCurrentAccount.mockResolvedValue({ PIIEnabled: false })
})

const expectOutcome = (outcome: string) =>
  expect(
    (global as any).diagnosticsMetrics.incrementCounter
  ).toHaveBeenCalledWith('subscribe_newsletter_total', 1, { outcome })

describe('subscribeNewsletter email validation', () => {
  it.each([
    undefined,
    null,
    '',
    '12345',
    'not an email',
    'a@',
    '@b.com',
    'a@b',
    'a/b@x.com',
    'a?b@x.com',
    'a#b@x.com',
    'a%2fb@x.com',
    'a\\b@x.com',
    '"a b"@x.com',
    '"a\tb"@x.com',
    '"a\\\\b"@x.com',
    '"a/b"@x.com',
  ])('rejects %p without calling the Profile System', async (email) => {
    const rejection = subscribe(email)

    await expect(rejection).rejects.toThrow('Invalid email')
    await expect(rejection).rejects.toBeInstanceOf(UserInputError)
    expect(getProfileInfo).not.toHaveBeenCalled()
  })

  it('trims the email without changing its case', async () => {
    getProfileInfo.mockResolvedValue({})

    await subscribe('  User@Test.COM ')

    expect(getProfileInfo.mock.calls[0][0].email).toBe('User@Test.COM')
    expect(updatePersonalPreferences.mock.calls[0][0].email).toBe(
      'User@Test.COM'
    )
  })
})

describe('subscribeNewsletter profile read', () => {
  it('treats 404 as a new profile', async () => {
    getProfileInfo.mockRejectedValue(httpError(404))

    await expect(subscribe('a@b.com')).resolves.toBe(true)
    expect(updatePersonalPreferences).toHaveBeenCalledWith(
      { email: 'a@b.com', userId: '' },
      { isNewsletterOptIn: 'True' },
      expect.anything(),
      {}
    )
  })

  it.each([
    ['400', wrapped(new UserInputError('http'), 400, 'BAD_USER_INPUT')],
    [
      '401',
      wrapped(new Error('http'), 401, 'UNAUTHENTICATED', 'AuthenticationError'),
    ],
    ['403', wrapped(new Error('http'), 403, 'FORBIDDEN', 'ForbiddenError')],
    ['503', httpError(503)],
    [
      'a timeout',
      Object.assign(new Error('timeout'), { code: 'ECONNABORTED' }),
    ],
    [
      'a network error',
      Object.assign(new Error('reset'), { code: 'ECONNRESET' }),
    ],
  ])('rejects on %s and skips the write', async (_, error) => {
    const context = createContext()

    getProfileInfo.mockRejectedValue(error)

    await expect(subscribe('a@b.com', context)).rejects.toBe(error)
    expect(updatePersonalPreferences).not.toHaveBeenCalled()
    expectOutcome('read_error')
    expect(context.vtex.logger.warn).toHaveBeenCalledTimes(1)
    expect(
      JSON.stringify(context.vtex.logger.warn.mock.calls[0])
    ).not.toContain('a@b.com')
  })

  it('reads the profile once and passes it to the write', async () => {
    const userProfile = { email: 'a@b.com' }

    getProfileInfo.mockResolvedValue(userProfile)

    await subscribe('a@b.com')

    expect(getProfileInfo).toHaveBeenCalledTimes(1)
    expect(updatePersonalPreferences.mock.calls[0][3]).toBe(userProfile)
  })
})

describe('subscribeNewsletter authorization and write', () => {
  it('returns true without writing for a non-owner of an existing profile', async () => {
    getProfileInfo.mockResolvedValue({ createdIn: '2020-01-01' })

    await expect(subscribe('a@b.com')).resolves.toBe(true)
    expect(updatePersonalPreferences).not.toHaveBeenCalled()
    expectOutcome('not_owner')
  })

  it.each([
    ['another user', { id: '1', account: 'store', user: 'other@b.com' }],
    ['another account', { id: '1', account: 'other', user: 'a@b.com' }],
    ['a prefix email', { id: '1', account: 'store', user: 'a@b.co' }],
    ['an extended email', { id: '1', account: 'store', user: 'a@b.com.br' }],
  ])('returns true without writing for a token of %s', async (_, tokenUser) => {
    getProfileInfo.mockResolvedValue({ createdIn: '2020-01-01' })
    getUserWithToken.mockResolvedValue(tokenUser)

    await expect(subscribe('a@b.com', createContext('token'))).resolves.toBe(
      true
    )
    expect(updatePersonalPreferences).not.toHaveBeenCalled()
    expectOutcome('not_owner')
  })

  it('keeps master owner semantics for a V2 profile without createdIn', async () => {
    getProfileInfo.mockResolvedValue({ id: 'x', pii: true })

    await expect(subscribe('a@b.com')).resolves.toBe(true)
    expect(updatePersonalPreferences).toHaveBeenCalledTimes(1)
    expect(getUserWithToken).not.toHaveBeenCalled()
  })

  it('surfaces the client UserInputError for a new V2 email', async () => {
    getProfileInfo.mockResolvedValue({ isNewsletterOptIn: false })
    updatePersonalPreferences.mockRejectedValue(
      new UserInputError('Profile not found for newsletter subscription')
    )

    await expect(subscribe('a@b.com')).rejects.toBeInstanceOf(UserInputError)
    expect(getCurrentAccount).not.toHaveBeenCalled()
    expectOutcome('write_error')
  })

  it('writes an existing V2 profile for its authenticated owner', async () => {
    getCurrentAccount.mockResolvedValue({ PIIEnabled: true })
    const userProfile = { id: 'x', pii: true }

    getProfileInfo.mockResolvedValue(userProfile)
    getUserWithToken.mockResolvedValue({
      id: '1',
      account: 'store',
      user: 'a@b.com',
    })

    await expect(subscribe('a@b.com', createContext('token'))).resolves.toBe(
      true
    )
    expect(updatePersonalPreferences).toHaveBeenCalledTimes(1)
    expect(updatePersonalPreferences.mock.calls[0][3]).toBe(userProfile)
  })

  it('does not match a token user that differs only in case', async () => {
    getProfileInfo.mockResolvedValue({ createdIn: '2020-01-01' })
    getUserWithToken.mockResolvedValue({
      id: '1',
      account: 'store',
      user: 'A@B.com',
    })

    await expect(subscribe('a@b.com', createContext('token'))).resolves.toBe(
      true
    )
    expect(updatePersonalPreferences).not.toHaveBeenCalled()
    expectOutcome('not_owner')
  })

  it('rejects a token user that only matches after Unicode case folding', async () => {
    getProfileInfo.mockResolvedValue({ createdIn: '2020-01-01' })
    getUserWithToken.mockResolvedValue({
      id: '1',
      account: 'store',
      user: '\u212Aa@b.com',
    })

    await expect(subscribe('ka@b.com', createContext('token'))).resolves.toBe(
      true
    )
    expect(updatePersonalPreferences).not.toHaveBeenCalled()
    expectOutcome('not_owner')
  })

  it.each(['\u212Aa@b.com', '\u00C9a@b.com'])(
    'writes when the token user equals the trimmed email %s',
    async (raw) => {
      getProfileInfo.mockResolvedValue({ createdIn: '2020-01-01' })
      getUserWithToken.mockResolvedValue({
        id: '1',
        account: 'store',
        user: raw,
      })

      await expect(subscribe(` ${raw} `, createContext('token'))).resolves.toBe(
        true
      )
      expect(updatePersonalPreferences).toHaveBeenCalledTimes(1)
    }
  )

  it('propagates a write failure', async () => {
    getProfileInfo.mockResolvedValue({})
    updatePersonalPreferences.mockRejectedValue(new Error('408'))

    await expect(subscribe('a@b.com')).rejects.toThrow('408')
    expectOutcome('write_error')
  })
})

describe('subscribeNewsletter metrics failures', () => {
  const metrics = (global as any).diagnosticsMetrics

  afterEach(() => {
    ;(global as any).diagnosticsMetrics = metrics
  })

  it.each([
    ['missing', () => delete (global as any).diagnosticsMetrics],
    [
      'throwing',
      () => {
        ;(global as any).diagnosticsMetrics = {
          incrementCounter: () => {
            throw new Error('otel boom')
          },
        }
      },
    ],
  ])('keeps the outcome when the metrics global is %s', async (_, setup) => {
    setup()
    const readError = httpError(503)

    getProfileInfo.mockResolvedValueOnce({ createdIn: '2020-01-01' })
    await expect(subscribe('a@b.com')).resolves.toBe(true)

    const context = createContext()

    getProfileInfo.mockRejectedValueOnce(readError)
    await expect(subscribe('a@b.com', context)).rejects.toBe(readError)
    expect(context.vtex.logger.warn).toHaveBeenCalledTimes(1)

    getProfileInfo.mockResolvedValueOnce({})
    updatePersonalPreferences.mockRejectedValueOnce(new Error('408'))
    await expect(subscribe('a@b.com')).rejects.toThrow('408')
  })
})
