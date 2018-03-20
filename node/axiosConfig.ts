import axios from 'axios'
import ResolverError from './errors/resolverError'

axios.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      throw error
    }

    const {config: { method, url }, status, data} = error.response
    const message = JSON.stringify({ method, status, url, data }, null, 2)
    throw new ResolverError(message, status)
  },
)
