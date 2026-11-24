import { UserInputError } from '@vtex/api'

export class ProfileNotFoundError extends UserInputError {}

export class ProfileAlreadyExistsError extends Error {}
