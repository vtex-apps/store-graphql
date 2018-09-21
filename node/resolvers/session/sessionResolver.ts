
import { path, toLower } from 'ramda'

const convertToBool = str => toLower(str) === 'true'

const profileFields = (profile, user) => ({
  isAuthenticatedAsCustomer: convertToBool(path(['isAuthenticated', 'value'], profile)),
  id: path(['id', 'value'], profile),
  firstName: path(['firstName', 'value'], profile),
  lastName: path(['lastName', 'value'], profile),
  email: path(['email', 'value'], profile) || path(['storeUserEmail', 'value'], user),
  document: path(['document', 'value'], profile),
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
    id: session.id,
    impersonable: convertToBool(namespaces.impersonate.canImpersonate.value),
    adminUserId: path(['adminUserId', 'value'], namespaces.authentication),
    adminUserEmail: path(['adminUserEmail', 'value'], namespaces.authentication),
    impersonate: {
      ...setProfileData(namespaces.profile, namespaces.impersonate)
    },
    ...setProfileData(namespaces.profile, namespaces.authentication)
  } : {}
}