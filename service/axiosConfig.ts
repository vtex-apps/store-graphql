import axios from 'axios'
import ResolverError from './errors/resolverError'

axios.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      throw error
    }

    const {config: {method}, status, url, data} = error.response
    const responseData = typeof data === 'object' ? JSON.stringify(data) : data
    const message = `External HTTP request failed. method=${method} status=${status} url=${url} data=${responseData}`
    throw new ResolverError(message, status)
  },
)
