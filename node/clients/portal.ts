import {
  InstanceOptions,
  IOContext,
  JanusClient,
  RequestConfig,
} from '@vtex/api'

import { statusToError } from '../utils'

export class Portal extends JanusClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...options?.headers,
        VtexIdclientAutCookie: ctx.authToken,
      },
    })
  }

  public sites = () =>
    this.get<Site[]>(this.routes.allSites(), { metric: 'portal-sites' })

  public storeConfigs = (activeSite: string) =>
    this.get(this.routes.storeConfigs(activeSite), {
      metric: 'portal-site-config',
    })

  public defaultSalesChannel = () =>
    this.get<SalesChannel>(this.routes.scDefault, {
      metric: 'portal-default-sales-channel',
    })

  protected get = <T>(url: string, config?: RequestConfig) =>
    this.http.get<T>(url, config).catch(statusToError)

  private get routes() {
    const basePVT = '/api/portal/pvt'

    return {
      allSites: () => `${basePVT}/sites/`,
      storeConfigs: (activeSite: string) =>
        `${basePVT}/sites/${activeSite}/configuration`,
      scDefault: '/api/catalog_system/pub/saleschannel/default',
    }
  }
}

export interface Site {
  id: string
  title: string
  siteName: string
}

export interface SalesChannel {
  Id: string
  Name: string
  IsActive: true
  ProductClusterId: string | null
  CountryCode: string
  CultureInfo: string
  TimeZone: string
  CurrencyCode: string
  CurrencySymbol: string
  CurrencyLocale: number
  CurrencyFormatInfo: {
    CurrencyDecimalDigits: number
    CurrencyDecimalSeparator: string
    CurrencyGroupSeparator: string
    CurrencyGroupSize: number
    StartsWithCurrencySymbol: boolean
  }
  Origin: any
  Position: number
  ConditionRule: any
}
