export default function jsonToQuerystring(
  key: string,
  value: any
): string | null {
  if (value === null || typeof value === 'undefined') {
    return null
  }

  // Example: {obj: {foo: {'fooValue'}, bar: 'barValue'}}
  // Result: "obj.foo=fooValue&obj.bar=barValue"
  if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value)
      .map(([currentKey, currentValue]) =>
        jsonToQuerystring(`${key}.${currentKey}`, currentValue)
      )
      .filter((querystring) => !!querystring)
      .join('&')
  }

  // Example: {obj: ['foo', 'bar']}
  // Result: "obj[0]=foo&obj[1]=bar"
  if (Array.isArray(value)) {
    return value
      .map((currentValue, index) =>
        jsonToQuerystring(`${key}[${index}]`, currentValue)
      )
      .filter((querystring) => !!querystring)
      .join('&')
  }

  return `${key}=${value}`
}
