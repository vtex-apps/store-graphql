import {
  InstanceOptions,
  IOContext,
  LicenseManager,
  RequestConfig,
} from '@vtex/api'

import { statusToError } from '../utils'

const FIVE_SECONDS_MS = 5 * 1000

export class LicenseManagerExtendedClient extends LicenseManager {
  constructor(context: IOContext, options?: InstanceOptions) {
    super(context, {
      ...options,
      headers: {
        ...options?.headers,
        VtexIdClientAutCookie: context.authToken ?? '',
      },
      timeout: FIVE_SECONDS_MS,
    })
  }

  public getCurrentAccount = (customFields?: string) =>
    this.get<Account>(`${this.baseUrl}/${this.context.account}`, {
      metric: 'account-getAccount',
      params: {
        extraFields: customFields,
      },
    }).then((account: Account) => {
      account.PIIEnabled = Boolean(account.Privacy)

      return account
    })

  protected get = <T>(url: string, config?: RequestConfig) =>
    this.http.get<T>(url, config).catch<any>(statusToError)

  private baseUrl = '/api/pvt/accounts'
}
