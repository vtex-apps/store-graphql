import { path, toLower } from 'ramda'

interface ProfileFields {
  document?: string
  email?: string
  firstName?: string
  id?: string
  isAuthenticatedAsCustomer?: boolean
  lastName?: string
  phone?: string
  priceTables: string[]
}

export interface SessionFields {
  adminUserEmail?: string
  adminUserId?: string
  id?: string
  cacheId?: string
  impersonable?: boolean
  impersonate?: { profile: ProfileFields }
  orderFormId?: string
  address?: any
  profile?: ProfileFields
  utmParams?: UtmParams
  utmiParams?: UtmiParams
  favoritePickup?: { address: CheckoutAddress; name: string }
  public?: {
    [key: string]: {
      value: string
    }
  }
}

interface UtmParams {
  source?: string
  medium?: string
  campaign?: string
  term?: string
  content?: string
}

interface UtmiParams {
  campaign?: string
  page?: string
  part?: string
}

const convertToBool = (str: any) => !!str && toLower(str) === 'true'

const priceTables = (profile: SessionProfile): string[] => {
  const priceTablesValue = profile?.priceTables?.value

  return priceTablesValue ? priceTablesValue.split(',') : []
}

const profileFields = (
  profile: SessionProfile,
  user: SessionImpersonate | SessionAuthentication
): ProfileFields => ({
  document: path(['document', 'value'], profile),
  email:
    path(['email', 'value'], profile) ??
    path(['storeUserEmail', 'value'], user),
  firstName: path(['firstName', 'value'], profile),
  id: path(['id', 'value'], profile),
  isAuthenticatedAsCustomer: convertToBool(
    path(['isAuthenticated', 'value'], profile)
  ),
  lastName: path(['lastName', 'value'], profile),
  phone: path(['phone', 'value'], profile),
  priceTables: priceTables(profile),
})

const setProfileData = (
  profile: SessionProfile,
  user: SessionImpersonate | SessionAuthentication
) =>
  path(['storeUserId', 'value'], user) && {
    profile: {
      ...profileFields(profile, user),
    },
  }

const setUtmParams = (publicFields: SessionPublic) => ({
  source: path(['utm_source', 'value'], publicFields),
  medium: path(['utm_medium', 'value'], publicFields),
  campaign: path(['utm_campaign', 'value'], publicFields),
  term: path(['utm_term', 'value'], publicFields),
  content: path(['utm_content', 'value'], publicFields),
})

const setUtmiParams = (publicFields: SessionPublic) => ({
  campaign: path(['utmi_cp', 'value'], publicFields),
  page: path(['utmi_p', 'value'], publicFields),
  part: path(['utmi_pc', 'value'], publicFields),
})

export const sessionFields = (
  session: Session
): SessionFields | Record<string, unknown> => {
  const { namespaces } = session

  return namespaces
    ? {
        address: path(['public', 'address', 'value'], namespaces),
        adminUserEmail: path(
          ['authentication', 'adminUserEmail', 'value'],
          namespaces
        ),
        adminUserId: path(
          ['authentication', 'adminUserId', 'value'],
          namespaces
        ),
        id: session.id,
        cacheId: session.id,
        impersonable: convertToBool(
          path(['impersonate', 'canImpersonate', 'value'], namespaces)
        ),
        impersonate: {
          ...setProfileData(namespaces.profile, namespaces.impersonate),
        },
        public: namespaces.public,
        utmParams: setUtmParams(namespaces.public),
        utmiParams: setUtmiParams(namespaces.public),
        orderFormId: path(['public', 'orderFormId', 'value'], namespaces),
        favoritePickup: path(['public', 'favoritePickup', 'value'], namespaces),
        ...setProfileData(namespaces.profile, namespaces.authentication),
      }
    : ({} as any)
}
