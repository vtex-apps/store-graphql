import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { ColossusContext } from 'colossus'
import { forEachObjIndexed } from 'ramda'

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

export class SessionDataSource extends RESTDataSource<ColossusContext> {
  constructor() {
    super()
  }

  public getSegmentData = () => this.get<SegmentData>(
    '/segments'
  )

  get baseURL() {
    const {vtex: {account}} = this.context
    return `http://${account}.vtexcommercestable.com.br/api`
  }

  protected willSendRequest (request: RequestOptions) {
    const {cookies, vtex: {authToken}} = this.context
    const segment = cookies.get('vtex_segment')

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        Authorization: authToken,
        ...segment && {Cookie: `vtex_segment=${segment}`},
        'Proxy-Authorization': authToken,
      }
    )
  }
}
