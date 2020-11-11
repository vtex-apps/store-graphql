import {
  adjust,
  curry,
  fromPairs,
  map,
  mergeAll,
  pipe,
  toPairs,
  zipObj,
} from 'ramda'

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
type Tuple = [string, any]
const renameKeysWith = curry((func: any, object: any) =>
  pipe<any, Tuple[], any, any>(toPairs, map(adjust(0, func)), fromPairs)(object)
)

/*
 * Convert a list of fields like [ {key: 'propertyName', value: 'String'}, ... ]
 * to a JSON format.
 */
const parseFieldsToJson = (fields: any) =>
  mergeAll(fields.map((field: any) => zipObj([field.key], [field.value])))

export { renameKeysWith, parseFieldsToJson }
