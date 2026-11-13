import { ForbiddenError, UserInputError } from '@vtex/api'

import { MasterData } from '../../clients/masterdata'
import {
  bucketAcronym,
  callerOf,
  outcomeOf,
} from '../../clients/masterdataAccess'
import {
  mapKeyAndStringifiedValues,
  mutations,
  queries,
} from '../../resolvers/document'
import { queries as listQueries } from '../../resolvers/list'

jest.mock('@vtex/api', () => {
  const api = jest.requireActual('../../__mocks__/@vtex/api')

  class MockForbiddenError extends Error {
    constructor(error: any) {
      super(error.message)
      Object.assign(this, { response: error.response })
    }
  }

  return {
    ...api,
    ForbiddenError: MockForbiddenError,
    ExternalClient: class {
      public context: unknown
      public options: unknown
      constructor(_: string, context: unknown, options: unknown) {
        this.context = context
        this.options = options
      }
    },
  }
})

const incrementCounter = jest.fn()
const warn = jest.fn()

;(global as any).diagnosticsMetrics = { incrementCounter }

const ioContext = (extra: Record<string, unknown> = {}) =>
  ({
    account: 'storecomponents',
    workspace: 'master',
    logger: { warn },
    ...extra,
  } as any)

function createClient(extra?: Record<string, unknown>) {
  const client = new MasterData(ioContext(extra))
  const http = {
    get: jest.fn(),
    getRaw: jest.fn(),
    patch: jest.fn().mockResolvedValue({}),
    post: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  }

  ;(client as any).http = http

  return { client, http }
}

const resolverContext = (
  client: MasterData,
  vtex: Record<string, unknown> = {}
) =>
  ({
    clients: { masterdataClient: client },
    vtex: { account: 'storecomponents', ...vtex },
    graphql: {
      cacheControl: { scope: 'public', noCache: false, noStore: false },
    },
  } as any)

const searchArgs = {
  acronym: 'CL',
  fields: ['email'],
  page: 1,
  pageSize: 10,
  where: 'email=a',
} as any

beforeEach(() => {
  jest.clearAllMocks()
})

describe('mapKeyAndStringifiedValues', () => {
  it('keeps null and strings, stringifies other values', () => {
    expect(
      mapKeyAndStringifiedValues({
        a: null,
        b: undefined,
        c: 'text',
        d: 1,
        e: { x: 1 },
        f: true,
      })
    ).toEqual([
      { key: 'a', value: null },
      { key: 'b', value: null },
      { key: 'c', value: 'text' },
      { key: 'd', value: '1' },
      { key: 'e', value: '{"x":1}' },
      { key: 'f', value: 'true' },
    ])
  })
})

describe('documents cache control', () => {
  it('makes masked responses private and uncached', async () => {
    const { client, http } = createClient()

    http.getRaw.mockResolvedValue({
      data: [{ id: '1', email: null }],
      headers: { 'x-vtex-md-pii-masked': 'true' },
    })
    const context = resolverContext(client)

    const result = await queries.documents({}, searchArgs, context)

    expect(result[0].fields).toContainEqual({ key: 'email', value: null })
    expect(context.graphql.cacheControl).toEqual({
      scope: 'private',
      noCache: true,
      noStore: true,
    })
  })

  it('makes credentialed unmasked responses private but cacheable', async () => {
    const { client, http } = createClient()

    http.getRaw.mockResolvedValue({ data: [], headers: {} })
    http.get.mockResolvedValue({ id: '1' })
    const searchContext = resolverContext(client, { storeUserAuthToken: 't' })
    const docContext = resolverContext(client, { adminUserAuthToken: 't' })

    await queries.documents({}, searchArgs, searchContext)
    await queries.document(
      {},
      { acronym: 'CL', id: '1', fields: ['id'] } as any,
      docContext
    )

    expect(searchContext.graphql.cacheControl).toEqual({
      scope: 'private',
      noCache: false,
      noStore: false,
    })
    expect(docContext.graphql.cacheControl).toEqual({
      scope: 'private',
      noCache: false,
      noStore: false,
    })
  })

  it('leaves anonymous unmasked responses public', async () => {
    const { client, http } = createClient()

    http.getRaw.mockResolvedValue({ data: [], headers: {} })
    const context = resolverContext(client)

    await queries.documents({}, searchArgs, context)

    expect(context.graphql.cacheControl).toEqual({
      scope: 'public',
      noCache: false,
      noStore: false,
    })
  })

  it('keeps schema defaults when the masked header is not true', async () => {
    const { client, http } = createClient()

    http.getRaw.mockResolvedValue({
      data: [],
      headers: { 'x-vtex-md-pii-masked': 'false' },
    })
    const context = resolverContext(client)

    await queries.documents({}, searchArgs, context)

    expect(context.graphql.cacheControl).toEqual({
      scope: 'public',
      noCache: false,
      noStore: false,
    })
  })

  it('keeps searchDocuments returning an array for list resolvers', async () => {
    const { client, http } = createClient()

    http.getRaw.mockResolvedValue({ data: [{ id: '1' }], headers: {} })

    expect(
      await client.searchDocuments('CL', ['id'], '', { page: 1, pageSize: 1 })
    ).toEqual([{ id: '1' }])
  })
})

describe('credentialed reads outside documents', () => {
  const callers = [
    [
      'documentSchema',
      (context: any) =>
        queries.documentSchema(
          {},
          { dataEntity: 'CL', schema: 's' } as any,
          context
        ),
    ],
    ['list', (context: any) => listQueries.list({}, { id: '1' }, context)],
    [
      'listsByOwner',
      (context: any) =>
        listQueries.listsByOwner(
          {},
          { owner: 'o', page: 1, pageSize: 1 },
          context
        ),
    ],
  ] as const

  it.each(callers)('%s keeps defaults with a caller token', async (_, call) => {
    const { client, http } = createClient()

    http.get.mockResolvedValue({ id: '1' })
    http.getRaw.mockResolvedValue({ data: [], headers: {} })
    const storeContext = resolverContext(client, { storeUserAuthToken: 't' })
    const adminContext = resolverContext(client, { adminUserAuthToken: 't' })

    await call(storeContext)
    await call(adminContext)

    expect(storeContext.graphql.cacheControl).toEqual({
      scope: 'public',
      noCache: false,
      noStore: false,
    })
    expect(adminContext.graphql.cacheControl).toEqual({
      scope: 'public',
      noCache: false,
      noStore: false,
    })
  })

  it.each(callers)('%s stays public when anonymous', async (_, call) => {
    const { client, http } = createClient()

    http.get.mockResolvedValue({ id: '1' })
    http.getRaw.mockResolvedValue({ data: [], headers: {} })
    const context = resolverContext(client)

    await call(context)

    expect(context.graphql.cacheControl).toEqual({
      scope: 'public',
      noCache: false,
      noStore: false,
    })
  })
})

describe('updateDocument', () => {
  it('forwards schema to the PATCH request', async () => {
    const { client, http } = createClient()

    await mutations.updateDocument(
      {},
      {
        acronym: 'CL',
        schema: 'v1',
        document: { fields: [{ key: 'id', value: 'abc' }] },
      } as any,
      resolverContext(client)
    )

    expect(http.patch).toHaveBeenCalledWith(
      '/dataentities/CL/documents/abc',
      { id: 'abc' },
      expect.objectContaining({ params: { _schema: 'v1' } })
    )
  })
})

describe('access metrics', () => {
  it('classifies the caller', () => {
    expect(callerOf(ioContext())).toBe('anonymous')
    expect(callerOf(ioContext({ storeUserAuthToken: 't' }))).toBe('shopper')
    expect(callerOf(ioContext({ adminUserAuthToken: 't' }))).toBe('admin')
    expect(
      callerOf(ioContext({ storeUserAuthToken: 't', adminUserAuthToken: 't' }))
    ).toBe('shopper')
  })

  it('sends only the caller cookie, never the app token', async () => {
    const sentinel = 'APP_TOKEN_SENTINEL'

    const cookieOf = async (extra: Record<string, unknown>) => {
      const { client, http } = createClient({ authToken: sentinel, ...extra })
      const { options } = client as any

      http.get.mockResolvedValue({})
      http.getRaw.mockResolvedValue({ data: [], headers: {} })

      await client.getDocument('CL', 'abc', ['email'])
      await client.searchDocuments('CL', ['email'], '', {
        page: 1,
        pageSize: 10,
      })
      await client.createDocument('CL', { email: 'a' })
      await client.updateDocument('CL', 'abc', { email: 'a' })
      await client.deleteDocument('CL', 'abc')
      await client.getSchema('CL', 'v1')
      await client.getPublicSchema('CL', 'v1')
      await client.uploadAttachment('CL', 'abc', 'file', {
        getHeaders: () => ({}),
      } as any)

      expect(options.authType).toBeUndefined()
      expect(
        JSON.stringify([
          options,
          ...Object.values(http).map((m) => m.mock.calls),
        ])
      ).not.toContain(sentinel)

      return options.headers.VtexIdclientAutCookie
    }

    expect(await cookieOf({})).toBeUndefined()
    expect(await cookieOf({ storeUserAuthToken: 'store' })).toBe('store')
    expect(await cookieOf({ adminUserAuthToken: 'admin' })).toBe('admin')
    expect(
      await cookieOf({
        storeUserAuthToken: 'store',
        adminUserAuthToken: 'admin',
      })
    ).toBe('store')
  })

  it('buckets acronyms', () => {
    expect(bucketAcronym('CL')).toBe('CL')
    expect(bucketAcronym('AD')).toBe('AD')
    expect(bucketAcronym('WL')).toBe('WL')
    expect(bucketAcronym('LP')).toBe('LP')
    expect(bucketAcronym('XYZ')).toBe('other')
  })

  it('maps outcomes', () => {
    expect(outcomeOf(new ForbiddenError('x'))).toBe('forbidden')
    expect(outcomeOf(new UserInputError('x'))).toBe('bad_request')
    expect(outcomeOf(new Error('x'))).toBe('error')
    expect(outcomeOf({ response: { status: 404 } })).toBe('not_found')
  })

  it('counts a successful call', async () => {
    const { client, http } = createClient({ storeUserAuthToken: 't' })

    http.get.mockResolvedValue({})
    await client.getDocument('ZZ', '1', ['id'])

    expect(incrementCounter).toHaveBeenCalledWith(
      'masterdata_access_total',
      1,
      {
        operation: 'getDocument',
        caller: 'shopper',
        acronym: 'other',
        outcome: 'ok',
      }
    )
  })

  it('counts and logs a forbidden call', async () => {
    const { client, http } = createClient()

    http.patch.mockRejectedValue({
      response: {
        status: 403,
        data: { Message: 'Cannot write in private fields' },
      },
      message: 'Request failed with status code 403',
    })

    await expect(
      client.updateDocument('CL', '1', { email: 'secret' })
    ).rejects.toBeInstanceOf(ForbiddenError)

    expect(incrementCounter).toHaveBeenCalledWith(
      'masterdata_access_total',
      1,
      {
        operation: 'updateDocument',
        caller: 'anonymous',
        acronym: 'CL',
        outcome: 'forbidden',
      }
    )
    expect(warn).toHaveBeenCalledWith({
      message: 'Master Data access forbidden',
      operation: 'updateDocument',
      acronym: 'CL',
      reason: 'Cannot write in private fields',
    })
  })

  it('logs the bucketed acronym when the raw one is not a short code', async () => {
    const { client, http } = createClient()

    http.get.mockRejectedValue({
      response: { status: 403, data: { Message: 'x'.repeat(500) } },
      message: 'Request failed with status code 403',
    })

    await expect(
      client.getDocument('not a code!'.repeat(5), '1', ['id'])
    ).rejects.toBeInstanceOf(ForbiddenError)

    const [payload] = warn.mock.calls[warn.mock.calls.length - 1]

    expect(payload.acronym).toBe('other')
    expect(payload.reason).toHaveLength(200)
  })

  it('logs the raw acronym while the metric buckets it', async () => {
    const { client, http } = createClient()

    http.get.mockRejectedValue({
      response: { status: 403, data: { Message: 'denied' } },
      message: 'Request failed with status code 403',
    })

    await expect(client.getDocument('XYZ', '1', ['id'])).rejects.toBeInstanceOf(
      ForbiddenError
    )

    expect(incrementCounter).toHaveBeenCalledWith(
      'masterdata_access_total',
      1,
      expect.objectContaining({ acronym: 'other', outcome: 'forbidden' })
    )
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ acronym: 'XYZ' })
    )
  })

  it('counts attachment uploads', async () => {
    const { client, http } = createClient()

    http.post.mockResolvedValue({})
    await client.uploadAttachment('CL', 'abc', 'file', {
      getHeaders: () => ({}),
    } as any)

    expect(incrementCounter).toHaveBeenCalledWith(
      'masterdata_access_total',
      1,
      expect.objectContaining({ operation: 'uploadAttachment', acronym: 'CL' })
    )
  })

  it('maps a forbidden search to ForbiddenError', async () => {
    const { client, http } = createClient()

    http.getRaw.mockRejectedValue({
      response: { status: 403, data: { Message: 'Forbidden' } },
      message: 'Request failed with status code 403',
    })

    await expect(
      client.searchDocuments('CL', ['id'], '', { page: 1, pageSize: 1 })
    ).rejects.toBeInstanceOf(ForbiddenError)

    expect(incrementCounter).toHaveBeenCalledWith(
      'masterdata_access_total',
      1,
      expect.objectContaining({
        operation: 'searchDocuments',
        outcome: 'forbidden',
      })
    )
  })

  it('does not fail calls when the metrics global is missing', async () => {
    const saved = (global as any).diagnosticsMetrics

    delete (global as any).diagnosticsMetrics

    try {
      const { client, http } = createClient()

      expect(
        await client.updateDocument('CL', '1', { email: 'a' })
      ).toBeDefined()

      http.patch.mockRejectedValue({
        response: { status: 403, data: {} },
        message: 'Request failed with status code 403',
      })

      await expect(
        client.updateDocument('CL', '1', { email: 'a' })
      ).rejects.toBeInstanceOf(ForbiddenError)
    } finally {
      ;(global as any).diagnosticsMetrics = saved
    }
  })

  it('does not fail calls when the counter throws', async () => {
    incrementCounter.mockImplementationOnce(() => {
      throw new Error('otel boom')
    })
    const { client, http } = createClient()

    http.get.mockResolvedValue({ id: '1' })

    expect(await client.getDocument('CL', '1', ['id'])).toEqual({
      id: '1',
    })
  })
})
