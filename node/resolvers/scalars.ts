import { GraphQLScalarType } from 'graphql'

/**
 * Legacy SDL used `String` for shipping quantity; resolvers and checkout must see a string.
 */
function coerceFlexibleQuantity(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const n = Math.trunc(value)
    if (n >= 0) {
      return String(n)
    }
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const n = parseInt(value, 10)
    if (!Number.isNaN(n) && n >= 0) {
      return String(n)
    }
  }

  throw new TypeError(`FlexibleQuantity cannot represent value: ${value}`)
}

function coerceFlexibleFloat(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const n = parseFloat(value)
    if (Number.isFinite(n)) {
      return n
    }
  }

  throw new TypeError(`FlexibleFloat cannot represent value: ${value}`)
}

function parseLiteralFlexibleQuantity(
  ast: any,
  variables?: { [key: string]: unknown } | null
): string {
  if (ast?.kind === 'Variable' && variables) {
    return coerceFlexibleQuantity(variables[ast.name.value])
  }
  switch (ast?.kind) {
    case 'IntValue':
    case 'FloatValue':
      return coerceFlexibleQuantity(parseFloat(ast.value))
    case 'StringValue':
      return coerceFlexibleQuantity(ast.value)
    default:
      throw new TypeError(
        `FlexibleQuantity cannot parse literal kind: ${ast?.kind}`
      )
  }
}

function parseLiteralFlexibleFloat(
  ast: any,
  variables?: { [key: string]: unknown } | null
): number {
  if (ast?.kind === 'Variable' && variables) {
    return coerceFlexibleFloat(variables[ast.name.value])
  }
  switch (ast?.kind) {
    case 'IntValue':
    case 'FloatValue':
      return coerceFlexibleFloat(parseFloat(ast.value))
    case 'StringValue':
      return coerceFlexibleFloat(ast.value)
    default:
      throw new TypeError(
        `FlexibleFloat cannot parse literal kind: ${ast?.kind}`
      )
  }
}

export const FlexibleQuantity = new GraphQLScalarType({
  name: 'FlexibleQuantity',
  description:
    'Non-negative quantity as String (legacy SDL). Accepts JSON number or numeric string.',
  serialize: coerceFlexibleQuantity,
  parseValue: coerceFlexibleQuantity,
  parseLiteral: parseLiteralFlexibleQuantity,
})

export const FlexibleFloat = new GraphQLScalarType({
  name: 'FlexibleFloat',
  description:
    'Finite number from a JSON number or a numeric string (variables or query literals).',
  serialize: coerceFlexibleFloat,
  parseValue: coerceFlexibleFloat,
  parseLiteral: parseLiteralFlexibleFloat,
})

function coerceFlexibleInt(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value)
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const n = parseInt(value, 10)
    if (!Number.isNaN(n)) {
      return n
    }
  }

  throw new TypeError(`FlexibleInt cannot represent value: ${value}`)
}

function parseLiteralFlexibleInt(
  ast: any,
  variables?: { [key: string]: unknown } | null
): number {
  if (ast?.kind === 'Variable' && variables) {
    return coerceFlexibleInt(variables[ast.name.value])
  }
  switch (ast?.kind) {
    case 'IntValue':
    case 'FloatValue':
      return coerceFlexibleInt(parseFloat(ast.value))
    case 'StringValue':
      return coerceFlexibleInt(ast.value)
    default:
      throw new TypeError(`FlexibleInt cannot parse literal kind: ${ast?.kind}`)
  }
}

export const FlexibleInt = new GraphQLScalarType({
  name: 'FlexibleInt',
  description:
    'Integer from a JSON number or a numeric string (variables or query literals).',
  serialize: coerceFlexibleInt,
  parseValue: coerceFlexibleInt,
  parseLiteral: parseLiteralFlexibleInt,
})

function coerceFlexibleString(value: unknown): string {
  if (value === null || value === undefined) {
    throw new TypeError('FlexibleString cannot represent null or undefined')
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  throw new TypeError(`FlexibleString cannot represent value: ${value}`)
}

function parseLiteralFlexibleString(
  ast: any,
  variables?: { [key: string]: unknown } | null
): string {
  if (ast?.kind === 'Variable' && variables) {
    return coerceFlexibleString(variables[ast.name.value])
  }
  switch (ast?.kind) {
    case 'StringValue':
      return ast.value
    case 'IntValue':
    case 'FloatValue':
      return coerceFlexibleString(parseFloat(ast.value))
    case 'BooleanValue':
      return ast.value ? 'true' : 'false'
    default:
      throw new TypeError(
        `FlexibleString cannot parse literal kind: ${ast?.kind}`
      )
  }
}

export const FlexibleString = new GraphQLScalarType({
  name: 'FlexibleString',
  description:
    'String from JSON string, number, or boolean (variables or query literals) for legacy storefront payloads.',
  serialize: coerceFlexibleString,
  parseValue: coerceFlexibleString,
  parseLiteral: parseLiteralFlexibleString,
})

export const scalarResolvers = {
  FlexibleQuantity,
  FlexibleFloat,
  FlexibleInt,
  FlexibleString,
}
