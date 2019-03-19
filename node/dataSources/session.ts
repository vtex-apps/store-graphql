import { RequestOptions } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

import { RESTDataSource } from './RESTDataSource'

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

export class SessionDataSource extends RESTDataSource {
  constructor() {
    super()
  }

  public getSegmentData = (defaultSegment: boolean = false) =>
    this.get<SegmentData>(
      '/segments',
      { defaultSegment },
      { metric: 'sessions-getSegmentData' }
    )

  public updateSession = (key: string, value: any) =>
    this.post(
      '/sessions',
      { public: { [key]: { value } } },
      { metric: 'sessions-updateSession' }
    )

  get baseURL() {
    const {
      vtex: { account },
    } = this.context
    return `http://${account}.vtexcommercestable.com.br/api`
  }

  protected willSendRequest(request: RequestOptions) {
    const defaultSegment = request.params.get('defaultSegment') === 'true'
    const {
      vtex: { authToken, segmentToken, sessionToken },
    } = this.context
    const segment = !defaultSegment ? segmentToken : undefined
    const sessionCookie = sessionToken

    if (!request.timeout) {
      request.timeout = DEFAULT_TIMEOUT_MS
    }

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        ...(segment && {
          Cookie: `vtex_segment=${segment};vtex_session=${sessionCookie}`,
        }),
        'Content-Type': 'application/json',
        'Proxy-Authorization': authToken,
      }
    )
  }
}
