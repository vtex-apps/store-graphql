import { mutations } from '../../resolvers/checkout'
// eslint-disable-next-line jest/no-mocks-import
import orderForm from '../../__mocks__/orderForm'

const mockContext = {
  vtex: {
    orderFormId: orderForm.orderFormId,
  },
  clients: {
    checkout: {
      orderForm: jest.fn().mockImplementation(() => orderForm),
      updateOrderFormMarketingData: jest.fn(),
      addItem: jest.fn(),
    },
  },
}

beforeEach(() => {
  jest.clearAllMocks()
})

test('should call add item with correct param', async () => {
  const itemToAdd = {
    id: 100,
    quantity: 1,
    seller: '1',
  }

  await mutations.addItem(
    {},
    {
      orderFormId: orderForm.orderFormId,
      items: [itemToAdd],
    },
    mockContext as any
  )

  const checkoutClient = mockContext.clients.checkout

  expect(checkoutClient.addItem.mock.calls[0][0]).toBe(orderForm.orderFormId)
  expect(checkoutClient.addItem.mock.calls[0][1]).toMatchObject([itemToAdd])
  expect(checkoutClient.updateOrderFormMarketingData).toBeCalledTimes(0)
})

describe('priceToken forwarding', () => {
  const itemWithToken = {
    id: 100,
    quantity: 1,
    seller: '1',
    priceToken: 'signed.price.token',
  }

  it('forwards priceToken to the checkout client', async () => {
    await mutations.addItem(
      {},
      { orderFormId: orderForm.orderFormId, items: [itemWithToken] },
      mockContext as any
    )

    const { addItem } = mockContext.clients.checkout

    expect(addItem).toHaveBeenCalledTimes(1)
    // `toEqual` rather than `toMatchObject`: the point is that nothing was
    // added to or removed from the item on the way to the client.
    expect(addItem.mock.calls[0][1]).toEqual([itemWithToken])
  })

  it('strips `options` without taking priceToken with it', async () => {
    const { addItem } = mockContext.clients.checkout

    // With `options` present the resolver runs a second phase to attach the
    // assembly options, and that phase reads the order form this call returns.
    addItem.mockResolvedValueOnce(orderForm)

    await mutations.addItem(
      {},
      {
        orderFormId: orderForm.orderFormId,
        items: [{ ...itemWithToken, options: [{ id: 1, quantity: 1, seller: '1' }] }],
      },
      mockContext as any
    )

    // The resolver drops `options` because assembly options are attached in a
    // second call. `priceToken` has to survive that same map.
    expect(addItem.mock.calls[0][1]).toEqual([itemWithToken])
  })
})

test.each([
  null,
  {
    utmSource: 'SOURCE DIFFERENT',
    utmMedium: 'medium',
    utmCampaign: 'campaign',
    utmiCampaign: 'campaign',
    utmiPart: 'part',
    utmipage: 'page33',
  },
])(
  'should correctly update order form marketing data when necessary',
  async (currentMarketingData: any) => {
    const itemToAdd = {
      id: 100,
      quantity: 1,
      seller: '1',
    }

    const checkoutClient = mockContext.clients.checkout

    checkoutClient.orderForm.mockImplementationOnce(() => ({
      ...orderForm,
      marketingData: currentMarketingData,
    }))
    await mutations.addItem(
      {},
      {
        orderFormId: orderForm.orderFormId,
        items: [itemToAdd],
        utmParams: { source: 'source', medium: 'medium', campaign: 'campaign' },
        utmiParams: { part: 'part', page: 'page', campaign: 'campaign' },
      },
      mockContext as any
    )

    expect(checkoutClient.addItem.mock.calls[0][0]).toBe(orderForm.orderFormId)
    expect(checkoutClient.addItem.mock.calls[0][1]).toMatchObject([itemToAdd])
    expect(checkoutClient.updateOrderFormMarketingData).toBeCalledTimes(1)
    expect(checkoutClient.updateOrderFormMarketingData.mock.calls[0][0]).toBe(
      orderForm.orderFormId
    )
    expect(
      checkoutClient.updateOrderFormMarketingData.mock.calls[0][1]
    ).toMatchObject({
      utmSource: 'source',
      utmMedium: 'medium',
      utmCampaign: 'campaign',
      utmiCampaign: 'campaign',
      utmiPart: 'part',
      utmipage: 'page',
    })
  }
)

test.each<any>([
  [
    {
      utmSource: 'source',
      utmMedium: 'medium',
      utmCampaign: 'campaign',
      utmiCampaign: 'campaign',
      utmiPart: 'part',
      utmipage: 'page',
    },
    { source: 'source', medium: 'medium', campaign: 'campaign' },
    { part: 'part', page: 'page', campaign: 'campaign' },
  ],
  [
    {
      utmSource: 'source',
      utmMedium: null,
      utmCampaign: null,
      utmiCampaign: null,
      utmiPart: null,
      utmipage: null,
    },
    { source: 'source' },
    {},
  ],
])(
  'should not update order form marketing if it is identical to the arg sent',
  async (currentMarketingData: any, utmParams: any, utmiParams: any) => {
    const itemToAdd = {
      id: 100,
      quantity: 1,
      seller: '1',
    }

    const checkoutClient = mockContext.clients.checkout

    checkoutClient.orderForm.mockImplementationOnce(() => ({
      ...orderForm,
      marketingData: currentMarketingData,
    }))

    await mutations.addItem(
      {},
      {
        orderFormId: orderForm.orderFormId,
        items: [itemToAdd],
        utmParams,
        utmiParams,
      },
      mockContext as any
    )

    expect(checkoutClient.addItem.mock.calls[0][0]).toBe(orderForm.orderFormId)
    expect(checkoutClient.addItem.mock.calls[0][1]).toMatchObject([itemToAdd])
    expect(checkoutClient.updateOrderFormMarketingData).toBeCalledTimes(0)
  }
)

test.each<any>([
  [undefined, undefined],
  [{}, {}],
])(
  'empty utmParams and utmiParams do not call updateOrderFormMarketingData',
  async (utmParams, utmiParams) => {
    const itemToAdd = {
      id: 100,
      quantity: 1,
      seller: '1',
    }

    const checkoutClient = mockContext.clients.checkout

    checkoutClient.orderForm.mockImplementationOnce(() => ({
      ...orderForm,
      marketingData: { coupon: null, marketingTags: [] },
    }))

    await mutations.addItem(
      {},
      {
        orderFormId: orderForm.orderFormId,
        items: [itemToAdd],
        utmParams,
        utmiParams,
      },
      mockContext as any
    )

    expect(checkoutClient.addItem.mock.calls[0][0]).toBe(orderForm.orderFormId)
    expect(checkoutClient.addItem.mock.calls[0][1]).toMatchObject([itemToAdd])
    expect(checkoutClient.updateOrderFormMarketingData).toBeCalledTimes(0)
  }
)
