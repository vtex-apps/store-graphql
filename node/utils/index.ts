import { AxiosError } from 'axios'
import { AuthenticationError, ForbiddenError, UserInputError } from '@vtex/api'

export * from './object'
export * from './cookie'

export function generateRandomName() {
  return (1 + Math.random()).toString(36).substring(2)
}

export function getFileExtension(fileName: string) {
  return fileName.match(/\.[0-9a-z]+$/i)
    ? (fileName.match(/\.[0-9a-z]+$/i) as any[])[0]
    : undefined
}

export function statusToError(e: any) {
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
