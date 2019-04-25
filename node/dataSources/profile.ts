import { HttpClient, HttpClientFactory, InstanceOptions, IOContext, IODataSource } from '@vtex/api'
import * as queryStringBuilder from 'qs'

const forProfile: HttpClientFactory = ({context, options}) => context &&
  HttpClient.forExternal(`http://${context.account}.vtexcommercestable.com.br/api/profile-system/pvt/profiles`, context, {...options, headers: {
    'Proxy-Authorization': context.authToken,
    'VtexIdClientAutCookie': context.authToken,
    'X-Vtex-Proxy-To': `http://${context.account}.vtexcommercestable.com.br`,
  }, metrics})

export class ProfileDataSource extends IODataSource {
  protected httpClientFactory = forProfile

  public constructor(ctx?: IOContext, opts?: InstanceOptions) {
    super(ctx, opts)
  }

  public getProfileInfo = (userEmail: string, customFields?: string) => {
    const queryString = queryStringBuilder.stringify({
      extraFields: customFields,
    })

    return this.http.get(
      `${userEmail}/personalData${queryString ? `?${queryString}` : ''}`,
      {
        metric: 'profile-system-getProfileInfo'
      }
    )
  }

  public getUserAddresses = (userEmail: string) => {
    return this.http.get(`${userEmail}/addresses`, {
      metric: 'profile-system-getUserAddresses'
    })
  }

  public getUserPayments = (userEmail: string) => {
    return this.http.get(`${userEmail}/vcs-checkout`, {
      metric: 'profile-system-getUserPayments'
    })
  }

  public updateProfileInfo = (
    userEmail: string,
    profile: Profile | { profilePicture: string },
    customFields?: string
  ) => {
    const queryString = queryStringBuilder.stringify({
      extraFields: customFields,
    })

    return this.http.post(
      `${userEmail}/personalData${queryString ? `?${queryString}` : ''}`,
      profile,
      {
        metric: 'profile-system-updateProfileInfo'
      }
    )
  }

  public updateAddress = (userEmail: string, addressesData: any) => {
    return this.http.post(`${userEmail}/addresses`, addressesData, {
      metric: 'profile-system-updateAddress'
    })
  }

  public deleteAddress = (userEmail: string, addressName: string) => {
    return this.http.delete(`${userEmail}/addresses/${addressName}`, {
      metric: 'profile-system-deleteAddress'
    })
  }

  public updatePersonalPreferences = (
    userEmail: string,
    personalPreferences: PersonalPreferences,
  ) => {
    return this.http.post(`${userEmail}/personalPreferences/`, personalPreferences, {
      metric: 'profile-system-subscribeNewsletter'
    })
  }
}
