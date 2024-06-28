import {
  InstanceOptions,
  IOContext,
  JanusClient,
  RequestConfig,
} from '@vtex/api'

import { statusToError } from '../../utils'

const FIVE_SECONDS_MS = 5 * 1000

export class ProfileClientV2 extends JanusClient {
  protected account: string
  private defaultPIIRequest: PIIRequest

  constructor(context: IOContext, options?: InstanceOptions) {
    super(context, {
      ...options,
      headers: {
        ...options?.headers,
        VtexIdClientAutCookie: context.authToken ?? '',
      },
      timeout: FIVE_SECONDS_MS,
      params: { an: context.account },
    })

    this.account = context.account

    this.defaultPIIRequest = {
      useCase: 'MyAcocunts',
      onBehalfOf: 'user',
    } as PIIRequest
  }

  public getProfileInfo = (
    user: CurrentProfile,
    customFields?: string,
    piiRequest?: PIIRequest
  ) => {
    const { userKey, alternativeKey } = this.getUserKeyAndAlternateKey(user)
    const url = this.getPIIUrl(
      `${this.baseUrl}/${userKey}`,
      alternativeKey,
      piiRequest
    )

    return this.get<ProfileV2>(url, {
      metric: 'profile-system-v2-getProfileInfo',
      params: {
        extraFields: customFields,
      },
    })
      .then((profile: ProfileV2[]) => {
        if (profile.length > 0) {
          const profileV2 = {
            ...profile[0].document,
            pii: true,
            id: profile[0].id,
          }

          return profileV2
        }

        return {} as Profile
      })
      .then((profile: Profile) => this.fillWithPreferences(profile, piiRequest))
  }

  private fillWithPreferences = (profile: Profile, piiRequest?: PIIRequest) => {
    return this.getPurchaseInfo(profile, piiRequest)
      .then((purchaseInfoList: PurchaseInfo[]) => {
        const [purchaseInfo] = purchaseInfoList

        profile.isNewsletterOptIn =
          purchaseInfo.document.clientPreferences?.isNewsletterOptIn ?? false

        return profile
      })
      .catch(() => {
        profile.isNewsletterOptIn = false

        return profile
      })
  }

  private getPurchaseInfo = (profile: Profile, piiRequest?: PIIRequest) => {
    const url = this.getPIIUrl(
      `${this.baseUrl}/${profile.id}/purchase-info`,
      undefined,
      piiRequest
    )

    return this.get<PurchaseInfo>(url, {
      metric: 'profile-system-v2-getUserPreferences',
    }).catch<any>((e) => {
      const { status } = e.response ?? {}

      if (status === 404) {
        return [] as PurchaseInfo[]
      }

      return statusToError(e)
    })
  }

  public createProfile = (profile: Profile) =>
    this.post<ProfileV2>(`${this.baseUrl}`, profile).then(
      (profileV2: ProfileV2) => {
        return {
          ...(profileV2.document as Profile),
          id: profileV2.id,
        }
      }
    )

  public updatePersonalPreferences = (
    _: CurrentProfile,
    personalPreferences: PersonalPreferences,
    currentUserProfile: Profile
  ) => {
    const parsedPersonalPreferences = Object.fromEntries(
      Object.entries(personalPreferences).map(([key, value]) => {
        return [key, value === 'True']
      })
    )

    const purchaseInfo = {
      clientPreferences: {
        ...parsedPersonalPreferences,
      },
    }

    return this.put(
      `${this.baseUrl}/${currentUserProfile.id}/purchase-info`,
      purchaseInfo,
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
    const { userKey, alternativeKey } = this.getUserKeyAndAlternateKey(user)

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

  public getUserAddresses = (
    _: CurrentProfile,
    currentUserProfile: Profile,
    piiRequest?: PIIRequest
  ) => {
    const url = this.getPIIUrl(
      `${this.baseUrl}/${currentUserProfile.id}/addresses`,
      undefined,
      piiRequest
    )

    return this.get<Address[]>(url, {
      metric: 'profile-system-v2-getUserAddresses',
    })
      .then((addresses: AddressV2[]) => this.translateToV1Address(addresses))
      .catch<any>((e) => {
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
        addressName: addressV2.addressName ?? addressV2.name,
        name: addressV2.name ?? addressV2.addressName ?? '',
        city: addressV2.locality,
        complement: addressV2.complement,
        country: addressV2.countryCode,
        geoCoordinates: addressV2.geoCoordinates ?? [],
        id: address.id,
        number: addressV2.streetNumber,
        postalCode: addressV2.postalCode,
        receiverName: addressV2.receiverName,
        reference: addressV2.nearly,
        state: addressV2.administrativeAreaLevel1 ?? '',
        street: addressV2.route,
        userId: addressV2.profileId,
        addressType: addressV2.addressType ?? 'residential',
        neighborhood: addressV2.localityAreaLevel1 ?? '',
      } as Address
    })

  private translateToV2Address = (addresses: Address[]) =>
    addresses.map((address: Address) => {
      return {
        id: address.id,
        document: {
          administrativeAreaLevel1: address.state ?? '',
          addressName: address.addressName ?? address.id,
          addressType: address.addressType ?? 'residential',
          countryCode: address.country,
          complement: address.complement ?? '',
          geoCoordinates: address.geoCoordinates ?? [],
          locality: address.city,
          localityAreaLevel1: address.neighborhood ?? '',
          name: (address.name ?? address.addressName) || '',
          nearly: address.reference ?? '',
          postalCode: address.postalCode,
          profileId: address.userId,
          route: address.street,
          streetNumber: address.number ?? '',
          receiverName: address.receiverName,
          userId: address.userId,
        },
      } as AddressV2
    })

  private mapAddressesObjToList(addressesObj: any): Address[] {
    return Object.entries<string>(addressesObj).map(([key, stringifiedObj]) => {
      try {
        const address = JSON.parse(stringifiedObj) as Address

        address.id = key

        return address
      } catch (e) {
        return {} as Address
      }
    })
  }

  public updateAddress = (user: CurrentProfile, addressesData: any) => {
    const addressesV1 = this.mapAddressesObjToList(addressesData).map(
      (addr: any) => {
        addr.geoCoordinates = addr.geoCoordinate

        return addr
      }
    )

    const addressesV2 = this.translateToV2Address(addressesV1)
    const [toChange] = addressesV2.filter(
      (addr) => addr.id === addressesV1[0].id
    )

    return this.getProfileInfo(user).then((profile) => {
      return this.getUserAddresses(user, profile).then(
        (addresses: Address[]) => {
          const [address] = addresses.filter(
            (addr) => addr.addressName === addressesV1[0].id
          )

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
              metric: 'profile-system-v2-createAddress',
            }
          )
        }
      )
    })
  }

  public deleteAddress = (user: CurrentProfile, addressName: string) => {
    return this.getProfileInfo(user).then((profile) => {
      this.getUserAddresses(user, profile).then((addresses: Address[]) => {
        const [address] = addresses.filter(
          (addr) => addr.addressName === addressName
        )

        return this.delete(
          `${this.baseUrl}/${profile.id}/addresses/${address.id}`,
          {
            metric: 'profile-system-v2-deleteAddress',
          }
        )
      })
    })
  }

  public getUserPayments = (user: CurrentProfile, piiRequest?: PIIRequest) => {
    const url = this.getPIIUrl(
      `${this.baseUrl}/${user.userId}/purchase-info`,
      undefined,
      piiRequest
    )
    return this.get(url, {
      metric: 'profile-system-v2-getUserPayments',
    }).catch<any>((e) => {
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

  protected put = <T>(url: string, data?: any, config?: RequestConfig) =>
    this.http.put<T>(url, data, config).catch<any>(statusToError)

  private baseUrl = 'api/storage/profile-system/profiles'

  private getUserKeyAndAlternateKey(user: CurrentProfile) {
    let alternativeKey
    let userKey

    if (user.email) {
      alternativeKey = 'email'
      userKey = user.email
    } else {
      userKey = user.userId
    }

    return {
      userKey,
      alternativeKey,
    }
  }

  private getPIIUrl(
    url: string,
    alternativeKey?: string,
    piiRequest?: PIIRequest
  ) {
    const params = []

    if (alternativeKey) {
      params.push(['alternativeKey', alternativeKey])
    }

    const currentPIIRequest = piiRequest ?? this.defaultPIIRequest

    if (currentPIIRequest) {
      params.push(
        ['useCase', currentPIIRequest.useCase],
        ['onBehalfOf', currentPIIRequest.onBehalfOf]
      )

      url += '/unmask'
    }

    const queryString = params.map((el) => el.join('=')).join('&')

    return `${url}?${queryString}`
  }
}
