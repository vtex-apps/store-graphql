class UserInputError extends Error {
  constructor(message) {
    super(message)
    this.name = 'UserInputError'
  }
}

class ResolverError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ResolverError'
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message)
    this.name = 'NotFoundError'
  }
}

class ForbiddenError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

class AuthenticationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

class ResolverWarning extends Error {
  constructor(message) {
    super(message)
    this.name = 'ResolverWarning'
  }
}

module.exports = {
  UserInputError,
  ResolverError,
  NotFoundError,
  ForbiddenError,
  AuthenticationError,
  ResolverWarning,
  LRUCache: jest
    .fn()
    .mockImplementation(() => ({ get: jest.fn(), set: jest.fn() })),
  Service: jest.fn(),
  IOClients: class IOClients {},
  MetricsAccumulator: jest.fn().mockImplementation(() => ({
    trackCache: jest.fn(),
    batch: jest.fn(),
  })),
  method: jest.fn((handlers) => handlers),
  formatTranslatableStringV2: jest.fn(),
  parseTranslatableStringV2: jest.fn(),
}
