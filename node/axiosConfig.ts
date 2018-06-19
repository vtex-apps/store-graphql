import axios from 'axios'
import ResolverError from './errors/resolverError'

axios.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      throw error
    }

    const { config: { method, url }, status, data } = error.response
    const banner = 'External HTTP request failed with error:\n'
    const message = banner + JSON.stringify({ method, status, url, data }, null, 2)
    throw new ResolverError(message, status)
  },
)
