import {
  InstanceOptions,
  IOContext,
  ExternalClient,
  RequestConfig,
} from '@vtex/api'

import { statusToError } from '../../utils'

const FIVE_SECONDS_MS = 5 * 1000

export class ProfileClientV2 extends ExternalClient {
  account: string
  defaultPIIRequest: PIIRequest

  constructor(baseUrl: string, context: IOContext, options?: InstanceOptions) {
    super(baseUrl, context, {
      ...options,
      headers: {
        ...(options && options.headers),
        VtexIdClientAutCookie: context.authToken ?? '',
      },
      timeout: FIVE_SECONDS_MS,
      params: { an: context.account },
    })

    this.account = context.account

    this.defaultPIIRequest = {
      useCase: "MyAcocunts",
      onBehalfOf: "user"
    } as PIIRequest
  }

  public getProfileInfo = (user: CurrentProfile, customFields?: string, piiRequest?: PIIRequest) => {
    const { userKey, alternativeKey } = this.getUserKeyAndAlternateKey(user)
    const url = this.getPIIUrl(`${this.baseUrl}/${userKey}`, alternativeKey, piiRequest)

    return this.get<ProfileV2>(
      url,
      {
        metric: 'profile-system-v2-getProfileInfo',
        params: {
          extraFields: customFields,
        },
      }
    ).then((profile: ProfileV2[]) => {
      if (profile.length > 0) {
        const profileV2 = {
          ...profile[0].document,
          pii: true,
          id: profile[0].id,
        }

        profileV2.isNewsletterOptIn = profileV2.isNewsletterOptIn || false

        return profileV2
      }

      return {} as Profile
    })
  }

  public createProfile = (profile: Profile) =>
    this.post<ProfileV2>(`${this.baseUrl}`, profile)
      .then((profileV2: ProfileV2) => {
        return {
          ...profileV2.document as Profile,
          id: profileV2.id
        }
      })

  public updatePersonalPreferences = (
    user: CurrentProfile,
    personalPreferences: PersonalPreferences
  ) => {
    const { userKey, alternativeKey } = this.getUserKeyAndAlternateKey(user)
    const parsedPersonalPreferences = Object.fromEntries(Object.entries(personalPreferences).map(([key, value]) => {
      return [key, value === 'True']
    }))

    return this.patch(
      `${this.baseUrl}/${userKey}?alternativeKey=${alternativeKey}`,
      parsedPersonalPreferences,
      {
        metric: 'profile-system-v2-subscribeNewsletter',
      }
    )
  }

  public updateProfileInfo = (
    user: CurrentProfile,
    profile: Profile | { profilePicture: string },
    customFields?: string
  ) => {
    let { userKey, alternativeKey } = this.getUserKeyAndAlternateKey(user)

    if (!(profile as Profile)) {
      const profileCast = profile as Profile
      profileCast.gender = profileCast.gender || ""
      profileCast.document = profileCast.document || ""
    }

    return this.patch(
      `${this.baseUrl}/${userKey}?alternativeKey=${alternativeKey}`,
      profile,
      {
        metric: 'profile-system-v2-updateProfileInfo',
        params: {
          extraFields: customFields,
        },
      }
    )
  }

  public getUserAddresses = (_: CurrentProfile, currentUserProfile: Profile, piiRequest?: PIIRequest) => {
    let url = this.getPIIUrl(`${this.baseUrl}/${currentUserProfile.id}/addresses`, undefined, piiRequest)

    return this.get<Address[]>(url, { metric: 'profile-system-v2-getUserAddresses', })
      .then((addresses: AddressV2[]) => this.translateToV1Address(addresses))
      .catch<any>(e => {
        const { status } = e.response ?? {}
        if (status === 404) {
          return [] as AddressV2[]
        }

        return statusToError(e)
      })
  }

  private translateToV1Address = (addresses: AddressV2[]) =>
    addresses.map((address: AddressV2) => {
      const addressV2 = address.document

      return {
        addressName: addressV2.name,
        city: addressV2.localityAreaLevel1,
        complement: addressV2.extend,
        country: addressV2.countryCode,
        geoCoordinates: addressV2.geoCoordinates,
        id: address.id,
        number: addressV2.streetNumber,
        postalCode: addressV2.postalCode,
        receiverName: addressV2.receiverName,
        reference: addressV2.nearly,
        state: addressV2.administrativeAreaLevel1,
        street: addressV2.route,
        userId: addressV2.profileId,
        addressType: addressV2.addressType || "residential",
        neighborhood: addressV2.neighborhood,
      } as Address
    })

  private translateToV2Address = (addresses: Address[]) =>
    addresses.map((address: Address) => {
      return {
        id: address.id,
        document: {
          administrativeAreaLevel1: address.state,
          addressType: address.addressType || "residential",
          countryCode: address.country,
          extend: address.complement || "",
          geoCoordinates: address.geoCoordinates,
          localityAreaLevel1: address.city,
          name: address.addressName,
          nearly: address.reference || "",
          postalCode: address.postalCode,
          profileId: address.userId,
          route: address.street,
          streetNumber: address.number,
          receiverName: address.receiverName,
          neighborhood: address.neighborhood,
        }
      } as AddressV2
  })

  private mapAddressesObjToList(addressesObj: any): Address[] {
    return Object.entries<string>(addressesObj).map(
      ([key, stringifiedObj]) => {
        try {
          const address = JSON.parse(stringifiedObj) as Address
          address.addressName = key
          return address
        } catch (e) {
          return {} as Address
        }
      }
    )
  }

  public updateAddress = (user: CurrentProfile, addressesData: any) => {
    const addressesV1 = this.mapAddressesObjToList(addressesData).map((addr:  any) => {
      addr.geoCoordinates = addr.geoCoordinate
      return addr
    })

    const addressesV2 = this.translateToV2Address(addressesV1)
    const toChange = addressesV2.filter(addr => addr.document.name == addressesV1[0].addressName)[0]

    return this.getProfileInfo(user)
      .then(profile => {
          return this.getUserAddresses(user, profile)
          .then((addresses: Address[]) => {
            const address = addresses.filter(addr => addr.addressName === addressesV1[0].addressName)[0]
            if (address) {
              return this.patch(
                `${this.baseUrl}/${profile.id}/addresses/${address.id}`,
                toChange.document,
                {
                  metric: 'profile-system-v2-updateAddress',
                }
              )
            }

            return this.post(
              `${this.baseUrl}/${profile.id}/addresses`,
              toChange.document,
              {
                metric: 'profile-system-v2-createAddress'
              }
            )
          })
      })
  }

  public deleteAddress = (user: CurrentProfile, addressName: string) => {
    return this.getProfileInfo(user)
      .then(profile => {
          this.getUserAddresses(user, profile)
          .then((addresses: Address[]) => {
            const address = addresses.filter(addr => addr.addressName === addressName)[0]
            return this.delete(
              `${this.baseUrl}/${profile.id}/addresses/${address.id}`,
              {
                metric: 'profile-system-v2-deleteAddress',
              }
            )
          }
        )
      }
    )
  }

  public getUserPayments = (user: CurrentProfile, piiRequest?: PIIRequest) => {
    let { userKey, alternativeKey } = this.getUserKeyAndAlternateKey(user)
    let url = this.getPIIUrl(`${this.baseUrl}/${userKey}/purchase-info/unmask`, alternativeKey, piiRequest)

    return this.get(url, {
      metric: 'profile-system-v2-getUserPayments',
    }).catch<any>(e => {
      const { status } = e.response ?? {}
      if (status === 404) {
        return [] as PaymentProfile[]
      }

      return statusToError(e)
    })
  }

  protected get = <T>(url: string, config?: RequestConfig) =>
    this.http.get<T>(url, config).catch<any>(statusToError)

  protected post = <T>(url: string, data?: any, config?: RequestConfig) =>
    this.http.post<T>(url, data, config).catch<any>(statusToError)

  protected delete = <T>(url: string, config?: RequestConfig) =>
    this.http.delete<T>(url, config).catch<any>(statusToError)

  protected patch = <T>(url: string, data?: any, config?: RequestConfig) =>
    this.http.patch<T>(url, data, config).catch<any>(statusToError)

  private baseUrl = 'api/profile-system/profiles'

  private getUserKeyAndAlternateKey(user: CurrentProfile) {
      let alternativeKey
      let userKey

      if (user.email) {
        alternativeKey = "email"
        userKey = user.email
      } else {
        userKey = user.userId
      }

    return {
      userKey,
      alternativeKey
    }
  }

  private getPIIUrl(url: string, alternativeKey?: string, piiRequest?: PIIRequest){
    const params = []

    if (alternativeKey) {
      params.push(["alternativeKey", alternativeKey])
    }

    const currentPIIRequest = piiRequest || this.defaultPIIRequest

    if (currentPIIRequest) {
      params.push(
        ["useCase", currentPIIRequest.useCase],
        ["onBehalfOf", currentPIIRequest.onBehalfOf]
      )

      url += "/unmask"
    }

    const queryString = params.map(el => el.join("=")).join("&")

    return `${url}?${queryString}`
  }
}
