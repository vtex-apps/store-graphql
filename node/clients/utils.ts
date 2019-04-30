import { AxiosError } from 'axios'
import { AuthenticationError, ForbiddenError, UserInputError } from '@vtex/api'

export function statusToError(e: any) {
  console.log('error', e)
  if (!e.response) {
    throw e
  }
  const { response } = e as AxiosError
  const { status } = response!
  if (status === 401) {
    throw new AuthenticationError(e)
  }
  if (status === 403) {
    throw new ForbiddenError(e)
  }
  if (status === 400) {
    throw new UserInputError(e)
  }
  throw e
}
