import { map, merge } from 'ramda'
import {headers, withAuthToken} from '../headers'
import httpResolver from '../httpResolver'
import paths from '../paths'
import profileResolver from './profileResolver'

export const mutations = {
  createAddress: httpResolver({
    data: ({ fields }) => fields,
    headers: withAuthToken(headers.profile),
    merge: ({ id, fields }) => merge({ id }, fields),
    method: 'PATCH',
    url: account => paths.profile(account).address(''),
  }),

  deleteAddress: httpResolver({
    headers: withAuthToken(headers.profile),
    method: 'DELETE',
    url: (account, { id }) => paths.profile(account).address(id),
  }),

  updateAddress: httpResolver({
    data: ({ fields }) => fields,
    headers: withAuthToken(headers.profile),
    merge: ({ id, fields }) => merge({ id }, fields),
    method: 'PATCH',
    url: (account, { id }) => paths.profile(account).address(id),
  }),

  updateProfile: httpResolver({
    data: ({ fields }) => fields,
    headers: withAuthToken(headers.profile),
    merge: ({ id, fields }) => merge({ id }, fields),
    method: 'PATCH',
    url: (account, { id }) => paths.profile(account).profile(id),
  }),
}

export const queries = {
  profile: profileResolver,
}
