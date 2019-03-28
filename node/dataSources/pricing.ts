import {
  RequestOptions,
  RESTDataSource
} from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

export class PricingDataSource extends RESTDataSource<Context> {
  constructor() {
    super()
  }

  public fixedPrices = (itemId: string = '') => {
    return this.get(`/${itemId}/fixed`)
  }

  get baseURL() {
    const {
      vtex: { account },
    } = this.context
    return `https://api.vtex.com/${account}/pricing/prices`
  }

  protected willSendRequest(request: RequestOptions) {
    const {
      vtex: { authToken, production },
      cookies,
    } = this.context
    const segment = cookies.get('vtex_segment')
    const [appMajorNumber] = process.env.VTEX_APP_VERSION!.split('.')
    const appMajor = `${appMajorNumber}.x`

    forEachObjIndexed(
      (value: string, param: string) => request.params.set(param, value),
      {
        __v: appMajor,
        production: production ? 'true' : 'false',
        ...(segment && { vtex_segment: segment }),
      }
    )

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        'Accept-Encoding': 'gzip',
        Authorization: authToken,
        ...(segment && { Cookie: `vtex_segment=${segment}` }),
      }
    )
  }
}
