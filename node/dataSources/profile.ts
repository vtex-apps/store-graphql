import {
  HttpClient,
  HttpClientFactory,
  InstanceOptions,
  IOContext,
  IODataSource,
} from '@vtex/api'
import * as queryStringBuilder from 'qs'

const forProfile: HttpClientFactory = ({ context, options }) =>
  context &&
  HttpClient.forExternal(
    `http://${
      context.account
    }.vtexcommercestable.com.br/api/profile-system/pvt/profiles`,
    context,
    {
      ...options,
      headers: {
        'Proxy-Authorization': context.authToken,
        VtexIdClientAutCookie: context.authToken,
        'X-Vtex-Proxy-To': `http://${
          context.account
        }.vtexcommercestable.com.br`,
      },
      metrics,
    }
  )

export class ProfileDataSource extends IODataSource {
  protected httpClientFactory = forProfile

  public constructor(ctx?: IOContext, opts?: InstanceOptions) {
    super(ctx, opts)
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
}

function getUserIdentification(user: CurrentProfile) {
  return user.userId || encodeURIComponent(user.email)
}
