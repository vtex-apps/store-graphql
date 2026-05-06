import { Coerce } from '../../directives/coerce'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a duck-typed scalar mock (same shape graphql 14.x scalars expose).
 * applyCoercion uses duck-typing instead of instanceof, so this is enough.
 */
function mockScalar(name: string) {
  return {
    name,
    serialize: (v: any) => v,
    parseValue: (v: any) => v,
    parseLiteral: (ast: any) => ast.value,
  }
}

/** Wraps a type in a NonNull-like shell (has .ofType, no .parseValue). */
function nonNull(type: any) {
  return { ofType: type }
}

/** Wraps a type in a List-like shell. */
function list(type: any) {
  return { ofType: type }
}

/**
 * Instantiates Coerce without going through the protected SchemaDirectiveVisitor
 * constructor — applyCoercion is stateless (no this.schema access), so the
 * instance state does not matter for these tests.
 */
function createCoerce(): Coerce {
  return Object.create(Coerce.prototype) as Coerce
}

function applyToField(type: any) {
  createCoerce().visitInputFieldDefinition({ type } as any)

  return type
}

function applyToArg(type: any) {
  createCoerce().visitArgumentDefinition({ type } as any)

  return type
}

// ---------------------------------------------------------------------------
// Visitor wiring
// ---------------------------------------------------------------------------

describe('Coerce.visitInputFieldDefinition', () => {
  it('patches parseValue and parseLiteral on the scalar type', () => {
    const type = mockScalar('Int')
    const originalParseValue = type.parseValue
    const originalParseLiteral = type.parseLiteral

    applyToField(type)

    expect(type.parseValue).not.toBe(originalParseValue)
    expect(type.parseLiteral).not.toBe(originalParseLiteral)
  })

  it('does nothing to types without parseValue (non-scalars)', () => {
    const inputObjectType = { name: 'ShippingItem', getFields: () => ({}) }

    expect(() => applyToField(inputObjectType)).not.toThrow()
    expect((inputObjectType as any).parseValue).toBeUndefined()
  })

  it('does nothing to scalars with unrecognised names', () => {
    const idScalar = mockScalar('ID')
    const original = idScalar.parseValue

    applyToField(idScalar)

    expect(idScalar.parseValue).toBe(original)
  })

  it('unwraps a NonNull wrapper and patches the inner type', () => {
    const inner = mockScalar('Int')
    const wrapped = nonNull(inner)

    applyToField(wrapped)

    expect(inner.parseValue('20')).toBe(20)
  })

  it('unwraps nested List → NonNull wrappers and patches the inner type', () => {
    const inner = mockScalar('String')
    const wrapped = list(nonNull(inner))

    applyToField(wrapped)

    expect(inner.parseValue(42)).toBe('42')
  })
})

describe('Coerce.visitArgumentDefinition', () => {
  it('patches the scalar type, same as visitInputFieldDefinition', () => {
    const type = mockScalar('Float')
    const original = type.parseValue

    applyToArg(type)

    expect(type.parseValue).not.toBe(original)
    expect(type.parseValue('3.14')).toBe(3.14)
  })
})

// ---------------------------------------------------------------------------
// Int coercion
// ---------------------------------------------------------------------------

describe('Int coercion — parseValue', () => {
  let type: ReturnType<typeof mockScalar>

  beforeEach(() => {
    type = applyToField(mockScalar('Int'))
  })

  it('accepts a string that represents a whole number', () => {
    expect(type.parseValue('20')).toBe(20)
  })

  it('accepts a negative string integer', () => {
    expect(type.parseValue('-5')).toBe(-5)
  })

  it('accepts a numeric integer', () => {
    expect(type.parseValue(42)).toBe(42)
  })

  it('rejects a string float ("20.5")', () => {
    expect(() => type.parseValue('20.5')).toThrow(/non-integer/)
  })

  it('rejects a numeric float (20.5)', () => {
    expect(() => type.parseValue(20.5)).toThrow(/non-integer/)
  })

  it('rejects a non-numeric string', () => {
    expect(() => type.parseValue('abc')).toThrow(/non-integer/)
  })

  it('rejects an empty string', () => {
    expect(() => type.parseValue('')).toThrow(/non-integer/)
  })
})

describe('Int coercion — parseLiteral', () => {
  let type: ReturnType<typeof mockScalar>

  beforeEach(() => {
    type = applyToField(mockScalar('Int'))
  })

  it('accepts an IntValue AST node', () => {
    expect(type.parseLiteral({ kind: 'IntValue', value: '20' })).toBe(20)
  })

  it('accepts a StringValue AST node with a whole-number string', () => {
    expect(type.parseLiteral({ kind: 'StringValue', value: '20' })).toBe(20)
  })

  it('rejects a StringValue AST node with a float string ("20.5")', () => {
    expect(type.parseLiteral({ kind: 'StringValue', value: '20.5' })).toBeNull()
  })

  it('rejects a FloatValue AST node', () => {
    expect(type.parseLiteral({ kind: 'FloatValue', value: '20.5' })).toBeNull()
  })

  it('rejects an unrecognised AST kind', () => {
    expect(
      type.parseLiteral({ kind: 'BooleanValue', value: 'true' })
    ).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Float coercion
// ---------------------------------------------------------------------------

describe('Float coercion — parseValue', () => {
  let type: ReturnType<typeof mockScalar>

  beforeEach(() => {
    type = applyToField(mockScalar('Float'))
  })

  it('accepts a string float ("3.14")', () => {
    expect(type.parseValue('3.14')).toBe(3.14)
  })

  it('accepts a string integer ("20")', () => {
    expect(type.parseValue('20')).toBe(20)
  })

  it('accepts a numeric float (3.14)', () => {
    expect(type.parseValue(3.14)).toBe(3.14)
  })

  it('rejects a non-numeric string', () => {
    expect(() => type.parseValue('abc')).toThrow(/non-numeric/)
  })
})

describe('Float coercion — parseLiteral', () => {
  let type: ReturnType<typeof mockScalar>

  beforeEach(() => {
    type = applyToField(mockScalar('Float'))
  })

  it('accepts a FloatValue AST node', () => {
    expect(type.parseLiteral({ kind: 'FloatValue', value: '3.14' })).toBe(3.14)
  })

  it('accepts an IntValue AST node', () => {
    expect(type.parseLiteral({ kind: 'IntValue', value: '20' })).toBe(20)
  })

  it('accepts a StringValue AST node with numeric content', () => {
    expect(type.parseLiteral({ kind: 'StringValue', value: '3.14' })).toBe(3.14)
  })

  it('rejects a StringValue AST node with non-numeric content', () => {
    expect(type.parseLiteral({ kind: 'StringValue', value: 'abc' })).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// String coercion
// ---------------------------------------------------------------------------

describe('String coercion — parseValue', () => {
  let type: ReturnType<typeof mockScalar>

  beforeEach(() => {
    type = applyToField(mockScalar('String'))
  })

  it('accepts a number and converts it to string', () => {
    expect(type.parseValue(20)).toBe('20')
  })

  it('accepts a float and converts it to string', () => {
    expect(type.parseValue(3.14)).toBe('3.14')
  })

  it('accepts a boolean and converts it to string', () => {
    expect(type.parseValue(true)).toBe('true')
  })

  it('passes a string through unchanged', () => {
    expect(type.parseValue('hello')).toBe('hello')
  })
})

describe('String coercion — parseLiteral', () => {
  let type: ReturnType<typeof mockScalar>

  beforeEach(() => {
    type = applyToField(mockScalar('String'))
  })

  it('accepts a StringValue AST node', () => {
    expect(type.parseLiteral({ kind: 'StringValue', value: 'hello' })).toBe(
      'hello'
    )
  })

  it('accepts an IntValue AST node and converts to string', () => {
    expect(type.parseLiteral({ kind: 'IntValue', value: '20' })).toBe('20')
  })

  it('accepts a FloatValue AST node and converts to string', () => {
    expect(type.parseLiteral({ kind: 'FloatValue', value: '3.14' })).toBe(
      '3.14'
    )
  })

  it('accepts a BooleanValue AST node and converts to string', () => {
    expect(type.parseLiteral({ kind: 'BooleanValue', value: 'true' })).toBe(
      'true'
    )
  })

  it('rejects an unrecognised AST kind', () => {
    expect(type.parseLiteral({ kind: 'NullValue' })).toBeNull()
  })
})
