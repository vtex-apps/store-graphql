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

export class SessionDataSource extends RESTDataSource<Context> {
  constructor() {
    super()
  }

  public getSegmentData = (defaultSegment: boolean = false) => this.get<SegmentData>('/segments', {defaultSegment})

  public getSession = () => this.get('/sessions/?items=*')
  public updateSession = (key: string, value: any) => this.post('/sessions', { public: { [key]: { value } } })

  get baseURL() {
    const {vtex: {account}} = this.context
    return `http://${account}.vtexcommercestable.com.br/api`
  }

  protected willSendRequest (request: RequestOptions) {
    const defaultSegment = request.params.get('defaultSegment') === 'true'
    const {cookies, vtex: {authToken}} = this.context
    const segment = !defaultSegment ? cookies.get('vtex_segment') : undefined
    const sessionCookie = cookies.get('vtex_session')

    if (!request.timeout) {
      request.timeout = DEFAULT_TIMEOUT_MS
    }

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        ...segment && {Cookie: `vtex_segment=${segment};vtex_session=${sessionCookie}`},
        'Content-Type': 'application/json',
        'Proxy-Authorization': authToken,
      }
    )
  }
}
