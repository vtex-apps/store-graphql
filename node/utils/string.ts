import { adjust } from 'ramda'

/**
 * Transforms string with whitespace, formatted as kebab-case or snake_case, to camelCase
 *
 * @func camelCase
 * @category String
 * @param {String} string String to be transformed
 * @return {String} New string with case transformed to camelCase
 * @example
 *
 * camelCase('utm_source') //=> 'utmSource'
 */
const camelCase = string =>
  string.replace(/[ -_]([a-z])/g, match => adjust(String.prototype.toUpperCase, 1, match))

export { camelCase }
