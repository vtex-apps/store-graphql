import {
  InstanceOptions,
  IOContext,
  JanusClient,
  RequestConfig,
} from '@vtex/api'

import { statusToError } from '../../utils'

const FIVE_SECONDS_MS = 5 * 1000

function mapAddressesObjToList(addressesObj: any): Address[] {
  return Object.values<string>(addressesObj).map(
    (stringifiedObj) => JSON.parse(stringifiedObj) as Address
  )
}

export class ProfileClientV2 extends JanusClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super(context, {
      ...options,
      headers: {
        ...(options && options.headers),
        VtexIdClientAutCookie: context.authToken ?? '',
      },
      timeout: FIVE_SECONDS_MS,
    })
  }

  public getProfileInfo = (user: CurrentProfile, customFields?: string) => {
    console.log("Will use V2")
    return this.get<Profile>(
      `${this.baseUrl}/${getUserIdentification(user)}/personalData`,
      {
        metric: 'profile-system-getProfileInfo',
        params: {
          extraFields: customFields,
        },
      }
    )
  }

  public getUserAddresses = (user: CurrentProfile) =>
    this.get(`${this.baseUrl}/${getUserIdentification(user)}/addresses`, {
      metric: 'profile-system-getUserAddresses',
    }).then(mapAddressesObjToList)

  public getUserPayments = (user: CurrentProfile) =>
    this.get(`${this.baseUrl}/${getUserIdentification(user)}/vcs-checkout`, {
      metric: 'profile-system-getUserPayments',
    })

  public updateProfileInfo = (
    user: CurrentProfile,
    profile: Profile | { profilePicture: string },
    customFields?: string
  ) =>
    this.post<Profile>(
      `${this.baseUrl}/${getUserIdentification(user)}/personalData`,
      profile,
      {
        metric: 'profile-system-updateProfileInfo',
        params: {
          extraFields: customFields,
        },
      }
    )

  public updateAddress = (user: CurrentProfile, addressesData: any) =>
    this.post(
      `${this.baseUrl}/${getUserIdentification(user)}/addresses`,
      addressesData,
      {
        metric: 'profile-system-updateAddress',
      }
    )

  public deleteAddress = (user: CurrentProfile, addressName: string) =>
    this.delete(
      `${this.baseUrl}/${getUserIdentification(user)}/addresses/${addressName}`,
      {
        metric: 'profile-system-deleteAddress',
      }
    )

  public updatePersonalPreferences = (
    user: CurrentProfile,
    personalPreferences: PersonalPreferences
  ) =>
    this.post(
      `${this.baseUrl}/${getUserIdentification(user)}/personalPreferences/`,
      personalPreferences,
      {
        metric: 'profile-system-subscribeNewsletter',
      }
    )

  public createProfile = (profile: Profile) =>
    this.post(this.baseUrl, { personalData: profile })

  protected get = <T>(url: string, config?: RequestConfig) =>
    this.http.get<T>(url, config).catch<any>(statusToError)

  protected post = <T>(url: string, data?: any, config?: RequestConfig) =>
    this.http.post<T>(url, data, config).catch<any>(statusToError)

  protected delete = <T>(url: string, config?: RequestConfig) =>
    this.http.delete<T>(url, config).catch<any>(statusToError)

  protected patch = <T>(url: string, data?: any, config?: RequestConfig) =>
    this.http.patch<T>(url, data, config).catch<any>(statusToError)

  private baseUrl = '/api/profile-system/pvt/profiles'
}

function getUserIdentification(user: CurrentProfile) {
  return user.userId || encodeURIComponent(user.email)
}
