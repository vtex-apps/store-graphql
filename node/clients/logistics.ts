import {
  InstanceOptions,
  IOContext,
  JanusClient,
  RequestConfig,
} from '@vtex/api'

import { statusToError } from '../utils'
import {
  LogisticOutput,
  LogisticPickupPoint,
} from '../resolvers/logistics/types'

const FOUR_SECONDS = 4 * 1000

export class LogisticsClient extends JanusClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...options?.headers,
        VtexIdclientAutCookie: ctx.authToken,
      },
      timeout: FOUR_SECONDS,
    })
  }

  public pickupById = (id: string) =>
    this.get<LogisticPickupPoint>(this.routes.pickUpById(id), {
      metric: 'logistics-pickupById',
    })

  public nearPickupPoints = (lat: string, long: string, maxDistance = 50) =>
    this.get<LogisticOutput>(
      this.routes.nearPickupPoints(lat, long, maxDistance),
      {
        metric: 'logistics-nearPickupPoints',
      }
    )

  public shipping = () =>
    this.get(this.routes.shipping, {
      metric: 'logistics-shipping',
    })

  protected get = <T>(url: string, config?: RequestConfig) =>
    this.http.get<T>(url, config).catch(statusToError) as Promise<T>

  private get routes() {
    const basePVT = '/api/logistics'

    return {
      shipping: `${basePVT}/pub/shipping/configuration`,
      nearPickupPoints: (lat: string, long: string, maxDistance: number) =>
        `${basePVT}/pvt/configuration/pickuppoints/_search?&page=1&pageSize=100&lat=${lat}&lon=${long}&maxDistance=${maxDistance}`,
      pickUpById: (id: string) =>
        `${basePVT}/pvt/configuration/pickuppoints/${id}`,
    }
  }
}
