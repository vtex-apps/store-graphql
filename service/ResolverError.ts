export default class ResolverError extends Error {
  public statusCode: number

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.name = 'ResolverError'
    this.statusCode = statusCode
  }
}
