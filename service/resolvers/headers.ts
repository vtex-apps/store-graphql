export const headers = {
  facade: {
    accept: 'application/vnd.vtex.search-api.v0+json',
  },
  json: {
    accept: 'application/json',
    'content-type': 'application/json',
  },
  profile: {
    accept: 'application/vnd.vtex.ds.v10+json',
    'content-type': 'application/json',
  },
}

export const withAuthToken = (currentHeaders = {}) => (ioContext) => ({
  ...currentHeaders,
  Authorization: `bearer ${ioContext.authToken}`,
})
