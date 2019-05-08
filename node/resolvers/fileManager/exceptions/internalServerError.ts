export class InternalServerError extends Error {
  constructor(
    public extensions: any,
    public message = 'Internal Server Error',
    public statusCode = 500
  ) {
    super(message)
  }
}
