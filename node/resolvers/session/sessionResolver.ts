
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
  const { namespaces: {impersonate, profile, authentication} } = session
  return impersonate && profile && authentication ? {
    adminUserEmail: path(['adminUserEmail', 'value'], authentication),
    adminUserId: path(['adminUserId', 'value'], authentication),
    ...setProfileData(profile, authentication),
    id: session.id,
    impersonable: convertToBool(impersonate.canImpersonate.value),
    impersonate: {
      ...setProfileData(profile, impersonate)
    }
  } : {}
}
