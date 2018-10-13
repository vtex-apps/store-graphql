import { Request, RequestOptions, RESTDataSource } from 'apollo-datasource-rest'

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

const NO_CACHE = {
  cacheOptions: {
    ttl: -1
  }
}

export class SessionDataSource extends RESTDataSource<ServiceContext> {
  constructor() {
    super()
  }

  public sessions = (items: string = '*') => this.get<Session>(
    `/sessions`,
    {
      items
    },
    NO_CACHE
  )

  public segments = () => this.get<Segment>(
    `/segments`,
    null,
    NO_CACHE
  )

  public personify = (email: string) => this.patch(
    `/sessions`,
    {
      public: {
        'vtex-impersonated-customer-email': {
          value: email
        }
      }
    }
  )

  public depersonify = () => this.patch(
    `/sessions`,
    {
      public: {
        'vtex-impersonated-customer-email': {
          value: ''
        }
      }
    }
  )

  get baseURL() {
    const {vtex: {account}} = this.context
    return `http://${account}.vtexcommercestable.com.br/api`
  }

  protected willSendRequest (request: RequestOptions) {
    const {vtex: {authToken}} = this.context
    request.headers.set('Cookie', this.context.header.cookie)
    request.headers.set('Authorization', authToken)
    request.headers.set('Content-Type', 'application/json')
    request.headers.set('Accept', 'application/json')
    request.headers.set('X-Vtex-Use-Https', 'true')
  }

  protected cacheKeyFor (request: Request): string {
    const { url } = request
    const [ pathname ] = url.split('?')
    return pathname
  }
}
