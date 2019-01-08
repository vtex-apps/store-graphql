import { OutboundDataSource, withOutboundAuth, withSegment, withTimeout } from '@vtex/api'

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

export class SessionDataSource extends OutboundDataSource<Context> {
  protected modifiers = [
    withTimeout(DEFAULT_TIMEOUT_MS),
    withOutboundAuth,
    withSegment,
  ]

  public getSegmentData = async () => this.get<SegmentData>('/segments')

  get baseURL() {
    const {vtex: {account}} = this.context
    return `http://${account}.vtexcommercestable.com.br/api`
  }
}
