import {
  GraphQLArgument,
  GraphQLFloat,
  GraphQLInputField,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLString,
} from 'graphql'
import { Kind } from 'graphql/language'
import { SchemaDirectiveVisitor } from 'graphql-tools'

const coercibleScalars: Record<string, GraphQLScalarType> = {
  Int: new GraphQLScalarType({
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
      if (ast.kind === Kind.INT) return parseInt(ast.value, 10)
      if (ast.kind === Kind.STRING) {
        const parsed = parseInt(ast.value, 10)

        if (!isNaN(parsed)) return parsed
      }

      return null
    },
  }),

  Float: new GraphQLScalarType({
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
      if (ast.kind === Kind.FLOAT || ast.kind === Kind.INT)
        return parseFloat(ast.value)
      if (ast.kind === Kind.STRING) {
        const parsed = parseFloat(ast.value)

        if (!isNaN(parsed)) return parsed
      }

      return null
    },
  }),

  String: new GraphQLScalarType({
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
  }),
}

// Walks NonNull/List wrappers and replaces the inner named type with its coercible version.
function replaceWithCoercible(
  type: GraphQLArgument['type']
): GraphQLArgument['type'] {
  if (type instanceof GraphQLNonNull) {
    return new GraphQLNonNull(replaceWithCoercible(type.ofType) as any)
  }

  if (type instanceof GraphQLList) {
    return new GraphQLList(replaceWithCoercible(type.ofType) as any)
  }

  if (type instanceof GraphQLScalarType && coercibleScalars[type.name]) {
    return coercibleScalars[type.name]
  }

  return type
}

/**
 * Directive that wraps Int, Float, and String scalar types with coercive
 * parseValue/parseLiteral so the field accepts values of a compatible
 * but differently-typed format (e.g. "20" as Int).
 *
 * Apply to INPUT_FIELD_DEFINITION or ARGUMENT_DEFINITION.
 */
export class Coerce extends SchemaDirectiveVisitor {
  public visitInputFieldDefinition(field: GraphQLInputField) {
    field.type = replaceWithCoercible(field.type) as any
  }

  public visitArgumentDefinition(argument: GraphQLArgument) {
    argument.type = replaceWithCoercible(argument.type) as any
  }
}
