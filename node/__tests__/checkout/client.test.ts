import { Checkout } from '../../clients/checkout'

const ioContext = {
  account: 'storecomponents',
  authToken: 'auth-token',
  operationId: 'operation-id',
  platform: 'vtex-io',
  product: '',
  production: false,
  region: 'aws-us-east-1',
  requestId: 'request-id',
  route: { id: '', params: {} },
  userAgent: 'test',
  workspace: 'master',
} as any

const ORDER_FORM_ID = '9d2a4b8a1c0f4a1e9b6f0a1c2d3e4f50'
const ITEMS_ROUTE = `/api/checkout/pub/orderForm/${ORDER_FORM_ID}/items`

function createClient() {
  const client = new Checkout(ioContext)

  const http = {
    post: jest.fn().mockResolvedValue({}),
    patch: jest.fn().mockResolvedValue({}),
  }

  // The client builds its own HttpClient on construction; swapping it out is
  // what lets us assert which verb `addItem` picks.
  Object.defineProperty(client, 'http', { value: http, writable: true })

  return { client, http }
}

const itemWithoutToken = { id: 100, quantity: 1, seller: '1' }
const itemWithToken = { ...itemWithoutToken, priceToken: 'signed.price.token' }

describe('addItem route selection', () => {
  it('keeps using POST when no item carries a priceToken', async () => {
    const { client, http } = createClient()

    await client.addItem(ORDER_FORM_ID, [itemWithoutToken])

    expect(http.patch).not.toHaveBeenCalled()
    expect(http.post).toHaveBeenCalledTimes(1)
    expect(http.post.mock.calls[0][0]).toBe(ITEMS_ROUTE)
    expect(http.post.mock.calls[0][1]).toEqual({
      orderItems: [itemWithoutToken],
    })
  })

  it('uses PATCH when at least one item carries a priceToken', async () => {
    const { client, http } = createClient()

    await client.addItem(ORDER_FORM_ID, [itemWithoutToken, itemWithToken])

    expect(http.post).not.toHaveBeenCalled()
    expect(http.patch).toHaveBeenCalledTimes(1)
    expect(http.patch.mock.calls[0][0]).toBe(ITEMS_ROUTE)
    expect(http.patch.mock.calls[0][1]).toEqual({
      orderItems: [itemWithoutToken, itemWithToken],
    })
  })

  it('sends the same payload and metric on both routes', async () => {
    const withToken = createClient()
    const withoutToken = createClient()

    await withToken.client.addItem(ORDER_FORM_ID, [itemWithToken])
    await withoutToken.client.addItem(ORDER_FORM_ID, [itemWithToken])

    expect(withToken.http.patch.mock.calls[0][2]).toMatchObject({
      metric: 'checkout-addItem',
    })
    expect(withoutToken.http.patch.mock.calls[0][2]).toMatchObject({
      metric: 'checkout-addItem',
    })
  })

  it.each([
    ['an empty token', { ...itemWithoutToken, priceToken: '' }],
    ['a null token', { ...itemWithoutToken, priceToken: null }],
    ['an undefined token', { ...itemWithoutToken, priceToken: undefined }],
  ])('keeps using POST with %s', async (_label, item) => {
    const { client, http } = createClient()

    await client.addItem(ORDER_FORM_ID, [item])

    expect(http.patch).not.toHaveBeenCalled()
    expect(http.post).toHaveBeenCalledTimes(1)
  })
})
