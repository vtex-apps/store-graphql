import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

const DEFAULT_TIMEOUT_MS = 5 * 1000

export interface SegmentData {
  campaigns?: any
  channel: string
  priceTables?: any
  regionId?: string
  utm_campaign?: string
  utm_source?: string
  utmi_campaign?: string
  currencyCode: string
  currencySymbol: string
  countryCode: string
  cultureInfo: string
}

export class SessionDataSource extends RESTDataSource<ServiceContext> {
  constructor() {
    super()
  }

  public getSegmentData = () => this.get<SegmentData>('/segments')

  get baseURL() {
    const {vtex: {account}} = this.context
    return `http://${account}.vtexcommercestable.com.br/api`
  }

  protected willSendRequest (request: RequestOptions) {
    const {cookies, vtex: {authToken}} = this.context
    const segment = cookies.get('vtex_segment')

    if (!request.timeout) {
      request.timeout = DEFAULT_TIMEOUT_MS
    }

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        ...segment && {Cookie: `vtex_segment=${segment}`},
        'Proxy-Authorization': authToken,
      }
    )
  }
}
