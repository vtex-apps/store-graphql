import {
  AuthenticationError,
  ForbiddenError,
  IOContext,
  UserInputError,
} from '@vtex/api'

import { incrementCounter } from '../utils/metrics'

const KNOWN_ACRONYMS = ['CL', 'AD', 'WL', 'LP']

export const callerOf = (ctx: IOContext) => {
  if (ctx.storeUserAuthToken) return 'shopper'
  if (ctx.adminUserAuthToken) return 'admin'

  return 'anonymous'
}

export const bucketAcronym = (acronym: string) =>
  KNOWN_ACRONYMS.includes(acronym) ? acronym : 'other'

export const outcomeOf = (error: unknown) => {
  if (error instanceof ForbiddenError) return 'forbidden'
  if (error instanceof AuthenticationError) return 'unauthorized'
  if (error instanceof UserInputError) return 'bad_request'

  return 'error'
}

const masterDataMessage = (error: any) =>
  error?.response?.data?.Message ?? error?.response?.data?.message

const count = (attributes: Record<string, string>) =>
  incrementCounter('masterdata_access_total', attributes)

export async function trackAccess<T>(
  ctx: IOContext,
  operation: string,
  acronym: string,
  call: () => Promise<T>
) {
  const labels = {
    operation,
    caller: callerOf(ctx),
    acronym: bucketAcronym(acronym),
  }

  let result: T

  try {
    result = await call()
  } catch (error) {
    const outcome = outcomeOf(error)

    count({ ...labels, outcome })

    if (outcome === 'forbidden') {
      ctx.logger.warn({
        message: 'Master Data access forbidden',
        operation,
        acronym,
        reason: masterDataMessage(error),
      })
    }

    throw error
  }

  count({ ...labels, outcome: 'ok' })

  return result
}
