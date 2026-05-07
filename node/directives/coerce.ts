import { SchemaDirectiveVisitor } from 'graphql-tools'

// Use string literals instead of importing Kind from graphql — the constants are
// stable across versions, but importing from graphql 0.13.x would fail the check
// because @vtex/api uses graphql 14.x internally with its own separate module copy.
const KIND = {
  INT: 'IntValue',
  FLOAT: 'FloatValue',
  STRING: 'StringValue',
  BOOLEAN: 'BooleanValue',
}

const coercibleBehavior: Record<
  string,
  { parseValue(v: unknown): unknown; parseLiteral(ast: any): unknown }
> = {
  Int: {
    parseValue(value) {
      if (typeof value === 'string' && value.trim() === '') {
        throw new Error(`Int cannot represent non-integer value: ${value}`)
      }

      const num = Number(value)

      if (!Number.isFinite(num) || !Number.isInteger(num)) {
        throw new Error(`Int cannot represent non-integer value: ${value}`)
      }

      return num
    },
    parseLiteral(ast) {
      if (ast.kind === KIND.INT) return parseInt(ast.value, 10)
      if (ast.kind === KIND.STRING) {
        const num = Number(ast.value)

        if (Number.isFinite(num) && Number.isInteger(num)) return num
      }

      return null
    },
  },

  Float: {
    parseValue(value) {
      const parsed = parseFloat(String(value))

      if (isNaN(parsed)) {
        throw new Error(`Float cannot represent non-numeric value: ${value}`)
      }

      return parsed
    },
    parseLiteral(ast) {
      if (ast.kind === KIND.FLOAT || ast.kind === KIND.INT)
        return parseFloat(ast.value)
      if (ast.kind === KIND.STRING) {
        const parsed = parseFloat(ast.value)

        if (!isNaN(parsed)) return parsed
      }

      return null
    },
  },

  String: {
    parseValue(value) {
      return String(value)
    },
    parseLiteral(ast) {
      if (
        ast.kind === KIND.STRING ||
        ast.kind === KIND.INT ||
        ast.kind === KIND.FLOAT ||
        ast.kind === KIND.BOOLEAN
      ) {
        return String(ast.value)
      }

      return null
    },
  },
}

// Duck-typing instead of instanceof: @vtex/api ships graphql 14.x in its own
// node_modules while the app declares graphql 0.13.x. The two module instances
// are different JS objects, so `instanceof GraphQLScalarType` (imported from
// 0.13.x) always returns false for types built by the 14.x schema builder.
function isScalarType(type: any): boolean {
  return (
    type != null &&
    typeof type.parseValue === 'function' &&
    typeof type.serialize === 'function' &&
    typeof type.parseLiteral === 'function'
  )
}

// Follow the ofType chain to unwrap NonNull/List without instanceof checks.
function unwrapType(type: any): any {
  return type?.ofType != null ? unwrapType(type.ofType) : type
}

function applyCoercion(fieldOrArg: any): void {
  const baseType = unwrapType(fieldOrArg.type)

  if (!isScalarType(baseType)) return

  const behavior = coercibleBehavior[baseType.name]

  if (!behavior) return

  // Mutate parseValue/parseLiteral directly on the type object (which comes
  // from graphql 14.x). healSchema only heals type REFERENCES (field.type
  // pointers), not function properties on the type itself, so this mutation
  // survives. The trade-off is that it affects all fields sharing this scalar
  // type globally — acceptable since the goal is schema-wide coercion for the
  // annotated scalar.
  baseType.parseValue = behavior.parseValue
  baseType.parseLiteral = behavior.parseLiteral
}

/**
 * Directive that applies lenient coercion to Int, Float, and String scalar
 * types by patching their parseValue/parseLiteral functions in place.
 *
 * Works despite the graphql version mismatch between @vtex/api (14.x) and the
 * app (0.13.x) because it uses duck-typing and in-place mutation instead of
 * instanceof checks and type-object replacement.
 */
export class Coerce extends SchemaDirectiveVisitor {
  public visitInputFieldDefinition(field: any) {
    applyCoercion(field)
  }

  public visitArgumentDefinition(argument: any) {
    applyCoercion(argument)
  }
}
