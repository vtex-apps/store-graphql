import {map, toPairs} from 'ramda'

export const objToNameValue = (keyName: string, valueName: string, record: Record<string, any>) =>
  map(([key, value]) => ({[keyName]: key, [valueName]: value}), toPairs(record))
