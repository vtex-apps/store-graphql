import { ProfileNotFoundError } from '../../clients/profile/errors'
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
    expectOutcome('invalid_email')
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

    expect(await subscribe('a@b.com')).toBe(true)
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

    expect(await subscribe('a@b.com')).toBe(true)
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

    expect(await subscribe('a@b.com', createContext('token'))).toBe(true)
    expect(updatePersonalPreferences).not.toHaveBeenCalled()
    expectOutcome('not_owner')
  })

  it('does not call VTEX ID for an anonymous caller', async () => {
    getProfileInfo.mockResolvedValue({ createdIn: '2020-01-01' })

    expect(await subscribe('a@b.com')).toBe(true)
    expect(getUserWithToken).not.toHaveBeenCalled()
    expectOutcome('not_owner')
  })

  it.each([400, 401, 403])(
    'treats a %s from VTEX ID as not the owner',
    async (status) => {
      getProfileInfo.mockResolvedValue({ createdIn: '2020-01-01' })
      getUserWithToken.mockRejectedValue(httpError(status))

      expect(await subscribe('a@b.com', createContext('token'))).toBe(true)
      expect(updatePersonalPreferences).not.toHaveBeenCalled()
      expectOutcome('not_owner')
    }
  )

  it.each([
    ['a 500', httpError(500)],
    ['a 503', httpError(503)],
    ['a 408', httpError(408)],
    ['a 429', httpError(429)],
    [
      'a timeout without response',
      Object.assign(new Error('timeout'), { code: 'ECONNABORTED' }),
    ],
  ])('fails the mutation on %s from VTEX ID', async (_, error) => {
    const context = createContext('token')

    getProfileInfo.mockResolvedValue({ createdIn: '2020-01-01' })
    getUserWithToken.mockRejectedValue(error)

    await expect(subscribe('a@b.com', context)).rejects.toBe(error)
    expect(updatePersonalPreferences).not.toHaveBeenCalled()
    expect(context.vtex.logger.warn).toHaveBeenCalledTimes(1)
    expectOutcome('identity_error')
  })

  it('returns true without writing for an anonymous caller on an existing V2 profile', async () => {
    getProfileInfo.mockResolvedValue({ id: 'x', pii: true })

    expect(await subscribe('a@b.com')).toBe(true)
    expect(updatePersonalPreferences).not.toHaveBeenCalled()
    expect(getUserWithToken).not.toHaveBeenCalled()
    expectOutcome('not_owner')
  })

  it('returns true without writing for another user on an existing V2 profile', async () => {
    getProfileInfo.mockResolvedValue({ id: 'x', pii: true })
    getUserWithToken.mockResolvedValue({
      id: '1',
      account: 'store',
      user: 'other@b.com',
    })

    expect(await subscribe('a@b.com', createContext('token'))).toBe(true)
    expect(updatePersonalPreferences).not.toHaveBeenCalled()
    expectOutcome('not_owner')
  })

  it('answers true and counts no_profile for a new V2 email', async () => {
    getProfileInfo.mockResolvedValue({ isNewsletterOptIn: false })
    updatePersonalPreferences.mockRejectedValue(
      new ProfileNotFoundError('Profile not found for newsletter subscription')
    )

    expect(await subscribe('a@b.com')).toBe(true)
    expect(getCurrentAccount).not.toHaveBeenCalled()
    expectOutcome('no_profile')
    expect(
      (global as any).diagnosticsMetrics.incrementCounter
    ).not.toHaveBeenCalledWith('subscribe_newsletter_total', 1, {
      outcome: 'ok',
    })
  })

  it('still surfaces other UserInputErrors from the write', async () => {
    getProfileInfo.mockResolvedValue({})
    updatePersonalPreferences.mockRejectedValue(new UserInputError('400'))

    await expect(subscribe('a@b.com')).rejects.toBeInstanceOf(UserInputError)
    expectOutcome('user_input_error')
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

    expect(await subscribe('a@b.com', createContext('token'))).toBe(true)
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

    expect(await subscribe('a@b.com', createContext('token'))).toBe(true)
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

    expect(await subscribe('ka@b.com', createContext('token'))).toBe(true)
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

      expect(await subscribe(` ${raw} `, createContext('token'))).toBe(true)
      expect(updatePersonalPreferences).toHaveBeenCalledTimes(1)
    }
  )

  it('propagates a write failure', async () => {
    getProfileInfo.mockResolvedValue({})
    updatePersonalPreferences.mockRejectedValue(new Error('408'))

    await expect(subscribe('a@b.com')).rejects.toThrow('408')
    expectOutcome('write_error')
  })

  it('counts ok after a successful write', async () => {
    getProfileInfo.mockResolvedValue({})

    expect(await subscribe('a@b.com')).toBe(true)
    expectOutcome('ok')
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
    expect(await subscribe('a@b.com')).toBe(true)

    const context = createContext()

    getProfileInfo.mockRejectedValueOnce(readError)
    await expect(subscribe('a@b.com', context)).rejects.toBe(readError)
    expect(context.vtex.logger.warn).toHaveBeenCalledTimes(1)

    getProfileInfo.mockResolvedValueOnce({})
    updatePersonalPreferences.mockRejectedValueOnce(new Error('408'))
    await expect(subscribe('a@b.com')).rejects.toThrow('408')
  })
})
