import {
  InstanceOptions,
  IOContext,
  JanusClient,
  RequestConfig,
} from '@vtex/api'
import * as queryStringBuilder from 'qs'

import { statusToError } from '../utils'

const THREE_SECONDS_TIMEOUT = 3 * 1000

export class ProfileClient extends JanusClient {
  public constructor(context: IOContext, options?: InstanceOptions) {
    super(context, {
      ...options,
      headers: {
        ...(options && options.headers),
        VtexIdClientAutCookie: context.authToken,
      },
      timeout: THREE_SECONDS_TIMEOUT,
    })
  }

  public getProfileInfo = (user: CurrentProfile, customFields?: string) =>
    this.http.get(
      `${this.baseUrl}/${getUserIdentification(user)}/personalData`,
      {
        metric: 'profile-system-getProfileInfo',
        params: {
          extraFields: customFields,
        },
      }
    )

  public getUserAddresses = (user: CurrentProfile) => {
    return this.http.get(
      `${this.baseUrl}/${getUserIdentification(user)}/addresses`,
      {
        metric: 'profile-system-getUserAddresses',
      }
    )
  }

  public getUserPayments = (user: CurrentProfile) => {
    return this.http.get(
      `${this.baseUrl}/${getUserIdentification(user)}/vcs-checkout`,
      {
        metric: 'profile-system-getUserPayments',
      }
    )
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
      `${this.baseUrl}/${getUserIdentification(user)}/personalData${
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
      `${this.baseUrl}/${getUserIdentification(user)}/addresses`,
      addressesData,
      {
        metric: 'profile-system-updateAddress',
      }
    )
  }

  public deleteAddress = (user: CurrentProfile, addressName: string) => {
    return this.http.delete(
      `${this.baseUrl}/${getUserIdentification(user)}/addresses/${addressName}`,
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
      `${this.baseUrl}/${getUserIdentification(user)}/personalPreferences/`,
      personalPreferences,
      {
        metric: 'profile-system-subscribeNewsletter',
      }
    )
  }

  public createProfile = (profile: Profile) => {
    return this.http.post(this.baseUrl, { personalData: profile })
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

  private baseUrl = '/api/profile-system/pvt/profiles'
}

function getUserIdentification(user: CurrentProfile) {
  return user.userId || encodeURIComponent(user.email)
}
