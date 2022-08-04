import {
  InstanceOptions,
  IOContext,
  ExternalClient,
  RequestConfig,
} from '@vtex/api'

import { statusToError } from '../utils'

export class CallCenterOperator extends ExternalClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super('http://licensemanager.vtex.com.br/api/pvt/accounts', ctx, {
      ...options,
      headers: {
        ...options?.headers,
        ...{ Accept: 'application/vnd.vtex.ds.v10+json' },
        ...(ctx.adminUserAuthToken
          ? { VtexIdclientAutCookie: ctx.adminUserAuthToken }
          : null),
      },
    })
  }

  public isValidCallcenterOperator = ({
    email,
    accountId,
  }: IsValidCallcenterOperatorArgs) =>
    this.get<boolean>(
      `${accountId}/products/2/logins/${email}/resources/Televendas/granted?ignoreIsAdmin=False`,
      { metric: 'callCenterOp-isValidCallcenterOperator' }
    )

  protected get = <T>(url: string, config?: RequestConfig) =>
    this.http.get<T>(url, config).catch(statusToError)
}

interface IsValidCallcenterOperatorArgs {
  email: string
  accountId: string
}
