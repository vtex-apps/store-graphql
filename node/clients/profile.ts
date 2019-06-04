import {
  InstanceOptions,
  IOContext,
  ExternalClient,
  RequestConfig,
} from '@vtex/api'
import * as queryStringBuilder from 'qs'

import { statusToError } from '../utils'

const THREE_SECONDS_TIMEOUT = 3 * 1000

export class ProfileClient extends ExternalClient {
  public constructor(context: IOContext, options?: InstanceOptions) {
    super(
      `http://${
        context.account
      }.vtexcommercestable.com.br/api/profile-system/pvt/profiles`,
      context,
      {
        ...options,
        headers: {
          ...(options && options.headers),
          'X-Vtex-Proxy-To': `http://${
            context.account
          }.vtexcommercestable.com.br`,
          VtexIdClientAutCookie: context.authToken,
        },
        timeout: THREE_SECONDS_TIMEOUT,
      }
    )
  }

  public getProfileInfo = (user: CurrentProfile, customFields?: string) => {
    const queryString = queryStringBuilder.stringify({
      extraFields: customFields,
    })

    return this.http.get(
      `${getUserIdentification(user)}/personalData${
        queryString ? `?${queryString}` : ''
      }`,
      {
        metric: 'profile-system-getProfileInfo',
      }
    )
  }

  public getUserAddresses = (user: CurrentProfile) => {
    return this.http.get(`${getUserIdentification(user)}/addresses`, {
      metric: 'profile-system-getUserAddresses',
    })
  }

  public getUserPayments = (user: CurrentProfile) => {
    return this.http.get(`${getUserIdentification(user)}/vcs-checkout`, {
      metric: 'profile-system-getUserPayments',
    })
  }

  public updateProfileInfo = (
    user: CurrentProfile,
    profile: Profile | { profilePicture: string },
    customFields?: string
  ) => {
    const queryString = queryStringBuilder.stringify({
      extraFields: customFields,
    })

    return this.http.post(
      `${getUserIdentification(user)}/personalData${
        queryString ? `?${queryString}` : ''
      }`,
      profile,
      {
        metric: 'profile-system-updateProfileInfo',
      }
    )
  }

  public updateAddress = (user: CurrentProfile, addressesData: any) => {
    return this.http.post(
      `${getUserIdentification(user)}/addresses`,
      addressesData,
      {
        metric: 'profile-system-updateAddress',
      }
    )
  }

  public deleteAddress = (user: CurrentProfile, addressName: string) => {
    return this.http.delete(
      `${getUserIdentification(user)}/addresses/${addressName}`,
      {
        metric: 'profile-system-deleteAddress',
      }
    )
  }

  public updatePersonalPreferences = (
    user: CurrentProfile,
    personalPreferences: PersonalPreferences
  ) => {
    return this.http.post(
      `${getUserIdentification(user)}/personalPreferences/`,
      personalPreferences,
      {
        metric: 'profile-system-subscribeNewsletter',
      }
    )
  }

  public createProfile = (profile: Profile) => {
    return this.http.post('', { personalData: profile })
  }

  protected get = <T>(url: string, config?: RequestConfig) => {
    return this.http.get<T>(url, config).catch(statusToError)
  }

  protected post = <T>(url: string, data?: any, config?: RequestConfig) => {
    return this.http.post<T>(url, data, config).catch(statusToError)
  }

  protected delete = <T>(url: string, config?: RequestConfig) => {
    return this.http.delete<T>(url, config).catch(statusToError)
  }

  protected patch = <T>(url: string, data?: any, config?: RequestConfig) => {
    return this.http.patch<T>(url, data, config).catch(statusToError)
  }
}

function getUserIdentification(user: CurrentProfile) {
  return user.userId || encodeURIComponent(user.email)
}
