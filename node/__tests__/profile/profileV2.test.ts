import { UserInputError } from '@vtex/api'

import { ProfileNotFoundError } from '../../clients/profile/errors'
import { ProfileClientV2 } from '../../clients/profile/profileV2'

const mockGet = jest.fn()
const mockPatch = jest.fn()
const mockPost = jest.fn()
const mockDelete = jest.fn()
const mockWarn = jest.fn()

jest.mock('@vtex/api', () => ({
  UserInputError: class extends Error {},
  ForbiddenError: class extends Error {},
  NotFoundError: class extends Error {},
  JanusClient: class {
    constructor(context: unknown) {
      ;(this as any).context = context
      ;(this as any).http = {
        get: mockGet,
        patch: mockPatch,
        post: mockPost,
        delete: mockDelete,
      }
    }
  },
}))

function createClient() {
  return new ProfileClientV2({
    authToken: 'fake-token',
    account: 'testaccount',
    logger: { warn: mockWarn },
  } as any)
}

const user = { email: 'user@test.com', userId: '' }

beforeEach(() => {
  jest.clearAllMocks()
})

describe('ProfileClientV2.updatePersonalPreferences', () => {
  it.each([
    ['True', true],
    ['False', false],
  ] as const)(
    'sends only isNewsletterOptIn %s in clientPreferences',
    async (optIn, expected) => {
      mockPatch.mockResolvedValue({})

      await createClient().updatePersonalPreferences(
        user,
        {
          firstName: 'True',
          homePhone: 'x',
          bindingId: 'b',
          bindingUrl: 'u',
          isNewsletterOptIn: optIn,
        },
        { id: 'profile-1' } as Profile
      )

      expect(mockPatch).toHaveBeenCalledWith(
        'api/storage/profile-system/profiles/profile-1/purchase-info',
        { clientPreferences: { isNewsletterOptIn: expected } },
        expect.anything()
      )
    }
  )

  it('rejects without HTTP call when the profile has no id', async () => {
    const result = createClient().updatePersonalPreferences(
      user,
      { isNewsletterOptIn: 'True' },
      {} as Profile
    )

    await expect(result).rejects.toBeInstanceOf(UserInputError)
    await expect(result).rejects.toBeInstanceOf(ProfileNotFoundError)
    await expect(result).rejects.toThrow('Profile not found')

    expect(mockPatch).not.toHaveBeenCalled()
  })

  describe('purchase-info patch', () => {
    const url = 'api/storage/profile-system/profiles/profile-1/purchase-info'
    const body = { clientPreferences: { isNewsletterOptIn: true } }
    const update = () =>
      createClient().updatePersonalPreferences(
        user,
        { isNewsletterOptIn: 'True' },
        { id: 'profile-1' } as Profile
      )

    it('patches only isNewsletterOptIn', async () => {
      mockPatch.mockResolvedValue({})

      await update()

      expect(mockPatch).toHaveBeenCalledWith(url, body, expect.anything())
    })

    it('does not post when the patch succeeds', async () => {
      mockPatch.mockResolvedValue({})

      await update()

      expect(mockPost).not.toHaveBeenCalled()
    })

    it.each([500, 403])(
      'propagates a %s from the patch without posting',
      async (status) => {
        mockPatch.mockRejectedValue({ response: { status } })

        await expect(update()).rejects.toBeDefined()
        expect(mockPost).not.toHaveBeenCalled()
      }
    )

    it('creates the purchase-info document when the patch returns 404', async () => {
      mockPatch.mockRejectedValue({ response: { status: 404 } })
      mockPost.mockResolvedValue({ id: 'profile-1' })

      await expect(update()).resolves.toEqual({ id: 'profile-1' })
      expect(mockPost).toHaveBeenCalledTimes(1)
      expect(mockPost).toHaveBeenCalledWith(url, body, expect.anything())
    })

    it('propagates a failure of the creation after a 404', async () => {
      const failure = { response: { status: 500 } }

      mockPatch.mockRejectedValue({ response: { status: 404 } })
      mockPost.mockRejectedValue(failure)

      await expect(update()).rejects.toBe(failure)
    })
  })
})

describe('ProfileClientV2.deleteAddress', () => {
  const addressV2 = { id: 'addr-1', document: { addressName: 'home' } }

  beforeEach(() => {
    mockGet.mockImplementation((url: string) =>
      Promise.resolve(
        url.includes('/addresses')
          ? [addressV2]
          : url.includes('/purchase-info')
          ? []
          : [{ id: 'profile-1', document: {} }]
      )
    )
  })

  it('deletes the matching address', async () => {
    mockDelete.mockResolvedValue({})
    await createClient().deleteAddress(user, 'home')
    for (let i = 0; i < 20 && !mockDelete.mock.calls.length; i++) {
      await new Promise((resolve) => setImmediate(resolve))
    }

    expect(mockDelete).toHaveBeenCalledWith(
      'api/storage/profile-system/profiles/profile-1/addresses/addr-1',
      expect.anything()
    )
  })
})

describe('ProfileClientV2 without a profile id', () => {
  beforeEach(() => {
    mockGet.mockResolvedValue([])
  })

  const urls = () =>
    [mockGet, mockPatch, mockPost, mockDelete].flatMap((m) =>
      m.mock.calls.map((c: unknown[]) => c[0])
    )

  it('getUserAddresses resolves empty without calling the API', async () => {
    mockGet.mockResolvedValue([{ id: 'u', addressName: 'home' }])
    await expect(
      createClient().getUserAddresses(user, {} as Profile)
    ).resolves.toEqual([])
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('updateAddress rejects without writing', async () => {
    await expect(
      createClient().updateAddress(user, {
        home: JSON.stringify({ addressName: 'home' }),
      })
    ).rejects.toThrow('Profile not found')
    expect(urls().filter((u) => String(u).includes('undefined'))).toEqual([])
    expect(mockPost).not.toHaveBeenCalled()
    expect(mockPatch).not.toHaveBeenCalled()
  })
})

describe('ProfileClientV2.getProfileInfo', () => {
  it('skips the purchase-info fetch when no profile is found', async () => {
    mockGet.mockResolvedValue([])

    const result = await createClient().getProfileInfo(user)

    expect(result).toEqual({ isNewsletterOptIn: false })
    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(mockGet.mock.calls[0][0]).not.toContain('/purchase-info')
  })

  it('defaults isNewsletterOptIn to false on empty purchase-info list', async () => {
    mockGet.mockImplementation((url: string) =>
      Promise.resolve(
        url.includes('/purchase-info')
          ? []
          : [{ id: 'profile-1', document: {} }]
      )
    )

    const result = await createClient().getProfileInfo(user)

    expect(result).toMatchObject({ id: 'profile-1', isNewsletterOptIn: false })
  })

  it('fails open when the purchase-info fetch rejects', async () => {
    mockGet.mockImplementation((url: string) =>
      url.includes('/purchase-info')
        ? Promise.reject({ response: { status: 500 } })
        : Promise.resolve([{ id: 'profile-1', document: {} }])
    )

    const result = await createClient().getProfileInfo(user)

    expect(result).toMatchObject({ id: 'profile-1', isNewsletterOptIn: false })
    expect(mockWarn).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 })
    )
  })

  it('does not warn when the purchase-info document does not exist', async () => {
    mockGet.mockImplementation((url: string) =>
      url.includes('/purchase-info')
        ? Promise.reject({ response: { status: 404 } })
        : Promise.resolve([{ id: 'profile-1', document: {} }])
    )

    const result = await createClient().getProfileInfo(user)

    expect(result).toMatchObject({ id: 'profile-1', isNewsletterOptIn: false })
    expect(mockWarn).not.toHaveBeenCalled()
  })
})
