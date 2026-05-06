import {
  GraphQLFloat,
  GraphQLInt,
  GraphQLScalarType,
  GraphQLString,
} from 'graphql'
import { Kind } from 'graphql/language'

// Replaces GraphQLInt in schema._typeMap so all Int fields accept "20" as 20.
// parseValue handles variables ({ qty: "20" }), parseLiteral handles inline values.
export const CoercibleInt = new GraphQLScalarType({
  name: 'Int',
  description: GraphQLInt.description,
  serialize: GraphQLInt.serialize,
  parseValue: (value) => {
    const parsed = parseInt(String(value), 10)

    if (isNaN(parsed)) {
      throw new Error(`Int cannot represent non-integer value: ${value}`)
    }

    return parsed
  },
  parseLiteral: (ast) => {
    if (ast.kind === Kind.INT) {
      return parseInt(ast.value, 10)
    }

    if (ast.kind === Kind.STRING) {
      const parsed = parseInt(ast.value, 10)

      if (!isNaN(parsed)) return parsed
    }

    return null
  },
})

// Replaces GraphQLFloat in schema._typeMap so all Float fields accept "3.14" as 3.14.
export const CoercibleFloat = new GraphQLScalarType({
  name: 'Float',
  description: GraphQLFloat.description,
  serialize: GraphQLFloat.serialize,
  parseValue: (value) => {
    const parsed = parseFloat(String(value))

    if (isNaN(parsed)) {
      throw new Error(`Float cannot represent non-numeric value: ${value}`)
    }

    return parsed
  },
  parseLiteral: (ast) => {
    if (ast.kind === Kind.FLOAT || ast.kind === Kind.INT) {
      return parseFloat(ast.value)
    }

    if (ast.kind === Kind.STRING) {
      const parsed = parseFloat(ast.value)

      if (!isNaN(parsed)) return parsed
    }

    return null
  },
})

// Replaces GraphQLString in schema._typeMap so all String fields accept numbers as strings.
export const CoercibleString = new GraphQLScalarType({
  name: 'String',
  description: GraphQLString.description,
  serialize: GraphQLString.serialize,
  parseValue: (value) => String(value),
  parseLiteral: (ast) => {
    if (
      ast.kind === Kind.STRING ||
      ast.kind === Kind.INT ||
      ast.kind === Kind.FLOAT ||
      ast.kind === Kind.BOOLEAN
    ) {
      return String(ast.value)
    }

    return null
  },
})
