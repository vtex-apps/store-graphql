import { path, toLower } from 'ramda'

interface ProfileFields {
  document?: string
  email?: string
  firstName?: string
  id?: string
  isAuthenticatedAsCustomer?: boolean
  lastName?: string
  phone?: string
}

export interface SessionFields {
  adminUserEmail?: string
  adminUserId?: string
  id?: string
  impersonable?: boolean
  impersonate?: { profile: ProfileFields }
  orderFormId?: string
  address?: any
  profile?: ProfileFields
  utmParams?: UtmParams
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

const convertToBool = (str: any) => !!str && toLower(str) === 'true'

const profileFields = (
  profile: SessionProfile,
  user: SessionImpersonate | SessionAuthentication
): ProfileFields => ({
  document: path(['document', 'value'], profile),
  email:
    path(['email', 'value'], profile) ||
    path(['storeUserEmail', 'value'], user),
  firstName: path(['firstName', 'value'], profile),
  id: path(['id', 'value'], profile),
  isAuthenticatedAsCustomer: convertToBool(
    path(['isAuthenticated', 'value'], profile)
  ),
  lastName: path(['lastName', 'value'], profile),
  phone: path(['phone', 'value'], profile),
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

export const sessionFields = (session: Session): SessionFields | {} => {
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
        impersonable: convertToBool(
          path(['impersonate', 'canImpersonate', 'value'], namespaces)
        ),
        impersonate: {
          ...setProfileData(namespaces.profile, namespaces.impersonate),
        },
        utmParams: setUtmParams(namespaces.public),
        orderFormId: path(['public', 'orderFormId', 'value'], namespaces),
        ...setProfileData(namespaces.profile, namespaces.authentication),
      }
    : {}
}

export interface Session {
  id: string
  namespaces?: {
    profile: SessionProfile
    impersonate: SessionImpersonate
    authentication: SessionAuthentication
    public: SessionPublic
  }
}

interface SessionProfile {
  id?: ObjValue
  email?: ObjValue
  firstName?: ObjValue
  lastName?: ObjValue
  phone?: ObjValue
  isAuthenticated?: ObjValue
}

interface SessionImpersonate {
  storeUserEmail?: ObjValue
  storeUserId?: ObjValue
}

interface SessionAuthentication {
  [key: string]: string
}

interface ObjValue {
  value: string
}

interface SessionPublic {
  orderFormId?: ObjValue
  utm_source?: ObjValue
  utm_medium?: ObjValue
  utm_campaign?: ObjValue
  utm_term?: ObjValue
  utm_content?: ObjValue
}
