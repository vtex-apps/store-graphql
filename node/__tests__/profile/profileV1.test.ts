import { ProfileClientV1 } from '../../clients/profile/profileV1'

const mockGet = jest.fn()

jest.mock('@vtex/api', () => ({
  JanusClient: class {
    constructor() {
      ;(this as any).http = { get: mockGet }
    }
  },
}))

function createClient() {
  const context = {
    authToken: 'fake-token',
    account: 'testaccount',
  } as any

  return new ProfileClientV1(context)
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('ProfileClientV1.getProfileInfo', () => {
  it('should return profile with pii=false when API returns a valid object', async () => {
    const apiResponse = {
      email: 'user@test.com',
      userId: 'abc-123',
      firstName: 'Test',
    }

    mockGet.mockResolvedValue(apiResponse)

    const client = createClient()
    const result = await client.getProfileInfo({
      email: 'user@test.com',
      userId: '',
    })

    expect(result).toEqual({ ...apiResponse, pii: false })
  })

  it('should return empty object when API returns empty string (non-existent profile)', async () => {
    mockGet.mockResolvedValue('')

    const client = createClient()
    const result = await client.getProfileInfo({
      email: 'new@test.com',
      userId: '',
    })

    expect(result).toEqual({})
  })
})
