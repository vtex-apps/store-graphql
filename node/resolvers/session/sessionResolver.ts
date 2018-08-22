
import { path, toLower } from 'ramda'

const convertToBool = str => toLower(str) === 'true'

const profileFields = profile => ({
    isAuthenticatedAsCustomer: convertToBool(path(['isAuthenticated', 'value'], profile)),
    id: path(['id', 'value'], profile),
    firstName: path(['firstName', 'value'], profile),
    lastName: path(['lastName', 'value'], profile),
    email: path(['email', 'value'], profile),
    document: path(['document', 'value'], profile),
    phone: path(['phone', 'value'], profile)
})

export const sessionFields = session => {
    const { namespaces } = session
    return namespaces ? {
        id: session.id,
        active: session.active,
        cartId: namespaces.checkout.cartId.value,
        impersonate: convertToBool(namespaces.impersonate.canImpersonate.value),
        adminUserId: path(['adminUserId', 'value'], namespaces.authentication),
        adminUserEmail: path(['adminUserEmail', 'value'], namespaces.authentication),
        profile: {
            ...profileFields(namespaces.profile)
        }
    } : {}
}