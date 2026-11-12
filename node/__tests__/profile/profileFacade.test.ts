import { ProfileClient } from '../../clients/profile'

jest.mock('@vtex/api', () => ({
  JanusClient: class {
    constructor(context: unknown) {
      ;(this as any).context = context
    }
  },
}))

const getProfileInfo = jest.fn()
const updatePersonalPreferences = jest.fn()

const context = {
  clients: {
    licenseManagerExtended: {
      getCurrentAccount: () => Promise.resolve({ PIIEnabled: true }),
    },
    profileV2: { getProfileInfo, updatePersonalPreferences },
  },
} as any

describe('ProfileClient.updatePersonalPreferences', () => {
  it('waits for the write and propagates its failure when no profile is passed', async () => {
    getProfileInfo.mockResolvedValue({ id: 'profile-1' })
    updatePersonalPreferences.mockRejectedValue(new Error('write failed'))

    const client = new ProfileClient({ authToken: 'token' } as any)

    await expect(
      client.updatePersonalPreferences(
        { email: 'a@b.com', userId: '' },
        { isNewsletterOptIn: 'True' } as any,
        context
      )
    ).rejects.toThrow('write failed')
  })
})
