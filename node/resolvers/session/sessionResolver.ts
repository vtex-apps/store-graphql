
import { path, toLower } from 'ramda'

const convertToBool = str => !!str && (toLower(str) === 'true')

const profileFields = (profile, user) => ({
  document: path(['document', 'value'], profile),
  email: path(['email', 'value'], profile) || path(['storeUserEmail', 'value'], user),
  firstName: path(['firstName', 'value'], profile),
  id: path(['id', 'value'], profile),
  isAuthenticatedAsCustomer: convertToBool(path(['isAuthenticated', 'value'], profile)),
  lastName: path(['lastName', 'value'], profile),
  phone: path(['phone', 'value'], profile)
})

const setProfileData = (profile, user) => (
  path(['storeUserId', 'value'], user) &&
  {
    profile: {
      ...profileFields(profile, user)
    }
  }
)

export const sessionFields = session => {
  const { namespaces } = session
  return namespaces ? {
    adminUserEmail: path(['authentication', 'adminUserEmail', 'value'], namespaces),
    adminUserId: path(['authentication', 'adminUserId', 'value'], namespaces),
    id: session.id,
    impersonable: convertToBool(path(['impersonate', 'canImpersonate', 'value'], namespaces)),
    impersonate: {
      ...setProfileData(namespaces.profile, namespaces.impersonate)
    },
    ...setProfileData(namespaces.profile, namespaces.authentication)
  } : {}
}
