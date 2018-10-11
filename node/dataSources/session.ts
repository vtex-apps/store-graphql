import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { AuthenticationError } from 'apollo-server-errors'

export interface Segment {
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

export interface Session {
  id: string
  namespaces?: {
    account?: any
    store?: any
    cookie?: any
    authentication?: any
    impersonate?: {
      canImpersonate?: {
        value: string
      }
    }
    profile?: {
      isAuthenticated: {
        value: string
      }
      id: {
        value: string
      }
      email: {
        value: string
      }
    }
    public?: any
  }
}

export class SessionDataSource extends RESTDataSource<ServiceContext> {
  constructor() {
    super()
  }

  public sessions = async () => {
    const session = this.context.cookies.get('vtex_session')
    if (!session) {
      throw new AuthenticationError('Session is not available in context')
    }
    return this.get<Session>(`/sessions/${session}?items=*`)
  }

  public segments = () => this.get<Segment>(
    '/segments'
  )

  get baseURL() {
    const {vtex: {account}} = this.context
    return `http://${account}.vtexcommercestable.com.br/api`
  }

  protected willSendRequest (request: RequestOptions) {
    const {vtex: {authToken}} = this.context
    request.headers.set('Authorization', authToken)
    request.headers.set('Content-Type', 'application/json')
    request.headers.set('Accept', 'application/json')
  }
}
