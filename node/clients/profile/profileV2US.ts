import {
  InstanceOptions,
  IOContext,
} from '@vtex/api'

import { ProfileClientV2 } from './profileV2'

const FIVE_SECONDS_MS = 5 * 1000

export class ProfileClientV2US extends ProfileClientV2 {
  account: string
  defaultPIIRequest: PIIRequest

  constructor(context: IOContext, options?: InstanceOptions) {
    super("https://profile-system-us-east-1.vtex.systems", context, {
      ...options,
      headers: {
        ...(options && options.headers),
        userAgent: context.userAgent,
        VtexIdClientAutCookie: context.authToken,
      },
      timeout: FIVE_SECONDS_MS,
    })

    this.account = context.account

    this.defaultPIIRequest = {
      useCase: "MyAcocunts",
      onBehalfOf: "user"
    } as PIIRequest
  }
}
