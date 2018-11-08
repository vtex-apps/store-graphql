import * as camelCase from 'camelcase'
import { adjust, both, curry, fromPairs, map, pickBy, pipe, toPairs } from 'ramda'

/**
 * Creates a new object with the own properties of the provided object, but the
 * keys renamed according to logic of renaming function.
 *
 * Keep in mind that in the case of keys conflict is behaviour undefined and
 * the result may vary between various JS engines!
 *
 * @func renameKeysWith
 * @category Object
 * @param {Function} func Function that renames the keys
 * @param {!Object} object Provided object
 * @return {!Object} New object with renamed keys
 * @see {@link https://github.com/ramda/ramda/wiki/Cookbook#rename-keys-of-an-object-by-a-function|Ramda Cookbook}
 * @example
 *
 * renameKeysWith(concat('a'), { A: 1, B: 2, C: 3 }) //=> { aA: 1, aB: 2, aC: 3 }
 */
const renameKeysWith = curry((func, object) =>
  pipe(
    toPairs,
    map(adjust(func, 0) as any),
    fromPairs as any
  )(object)
)

const isTruthy = val => !!val
const isUtm = (_, key) => key.startsWith('utm')
const isValidUtm = both(isUtm, isTruthy)

const getMarketingDataFromSegment = ({ segmentData }) => renameKeysWith(camelCase, pickBy(isValidUtm, segmentData))

export { getMarketingDataFromSegment }
