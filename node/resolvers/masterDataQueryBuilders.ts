export const generateBetweenConstraint = (field, lowerLimit, upperLimit) => {
  return `(${field} between ${lowerLimit} and ${upperLimit})`
}

export const generateOrConstraint = (list, field) => {
  return `(${list.reduce((result, value) => {
    if (result === '') { return `${field}=${value}` }

    return `${result} OR ${field}=${value}`
  }, '')})`
}