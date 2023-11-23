import jsonToQuerystring from '../../utils/jsonToQuerystring'

describe('json to querystring', () => {
  it('should return null for null objects', () => {
    expect(jsonToQuerystring('request', null)).toBeNull()
  })

  it('should convert an array into a querystring', () => {
    const testArray = ['foo', 'bar']
    const key = 'myKey'

    expect(jsonToQuerystring(key, testArray)).toBe('myKey[0]=foo&myKey[1]=bar')
  })

  it('should convert an object into a querystring', () => {
    const testObj = { foo: 'foo', bar: 'bar' }
    const key = 'myKey'

    expect(jsonToQuerystring(key, testObj)).toBe('myKey.foo=foo&myKey.bar=bar')
  })

  it('should convert an object with nested objects, arrays, null fields and undefined fields into a querystring', () => {
    const testObj = {
      items: [
        { id: '1', quantity: 1, seller: '1' },
        { id: '2', quantity: 1, seller: '2' },
      ],
      shippingData: {
        logisticsInfo: [{ regionId: 'v2.3C4B555127ED49C492010704E5A0417F' }],
      },
      marketingData: {
        utmSource: 'UTMSOURCE',
        utmCampaign: 'UTMCAMPAIGN',
      },
      isCheckedIn: false,
      undefinedParameter: undefined,
      nullParameter: null,
    }

    const key = 'myKey'

    expect(jsonToQuerystring(key, testObj)).toBe(
      'myKey.items[0].id=1&myKey.items[0].quantity=1&myKey.items[0].seller=1&myKey.items[1].id=2&myKey.items[1].quantity=1&myKey.items[1].seller=2&myKey.shippingData.logisticsInfo[0].regionId=v2.3C4B555127ED49C492010704E5A0417F&myKey.marketingData.utmSource=UTMSOURCE&myKey.marketingData.utmCampaign=UTMCAMPAIGN&myKey.isCheckedIn=false'
    )
  })
})
