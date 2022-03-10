import {
  InstanceOptions,
  IOContext,
  JanusClient,
} from '@vtex/api'

const FIVE_SECONDS_MS = 5 * 1000

export class ProfileClient extends JanusClient {
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

  public getProfileInfo = (user: CurrentProfile, context: Context, customFields?: string) =>
    this.getProfileClient(context).
      then(profileClient => profileClient.getProfileInfo(user, customFields))

  public getUserAddresses = (user: CurrentProfile, context: Context) =>
    this.getProfileClient(context).
      then(profileClient => profileClient.getUserAddresses(user))

  public getUserPayments = (user: CurrentProfile, context: Context) =>
    this.getProfileClient(context).
      then(profileClient => profileClient.getUserPayments(user))

  public updateProfileInfo = (
    user: CurrentProfile,
    profile: Profile | { profilePicture: string },
    context: Context,
    customFields?: string
  ) =>
    this.getProfileClient(context).
      then(profileClient => profileClient.updateProfileInfo(user, profile, customFields))

  public updateAddress = (user: CurrentProfile, addressesData: any, context: Context) =>
    this.getProfileClient(context).
      then(profileClient => profileClient.updateAddress(user, addressesData))

  public deleteAddress = (user: CurrentProfile, addressName: string, context: Context) =>
    this.getProfileClient(context).
      then(profileClient => profileClient.deleteAddress(user, addressName))

  public updatePersonalPreferences = (
    user: CurrentProfile,
    personalPreferences: PersonalPreferences,
    context: Context
  ) =>
    this.getProfileClient(context).
      then(profileClient => profileClient.updatePersonalPreferences(user, personalPreferences))

  public createProfile = (profile: Profile, context: Context) =>
    this.getProfileClient(context).
      then(profileClient => profileClient.createProfile(profile))

  private getProfileClient = (context: Context) => {
    let licenseManager = context.clients.licenseManagerExtended

    return licenseManager.getCurrentAccount().then(account => {
      if (account.PIIEnabled) {
        return context.clients.profileV2
      }
      return context.clients.profileV1
    })
  }
}
