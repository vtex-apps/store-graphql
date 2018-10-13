import { path, pathEq, pluck, prop } from 'ramda'

export const resolvers = {
  Session: {
    adminUserEmail: path(['namespaces', 'authentication', 'adminUserEmail', 'value']),

    adminUserId: path(['namespaces', 'authentication', 'adminUserId', 'value']),

    cacheId: prop('id'),

    id: prop('id'),

    impersonable: pathEq(['namespaces', 'impersonate', 'canImpersonate', 'value'], 'true'),

    profile: (root) => {
      const profile = path<any>(['namespaces', 'profile'], root)
      const email = path(['email', 'value'], profile)
      return email ? pluck('value', profile) : null
    },
  }
}
