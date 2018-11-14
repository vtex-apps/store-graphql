export const generateBetweenConstraint = (field, lowerLimit, upperLimit) => {
  return `${field} between ${lowerLimit} and ${upperLimit}`
}

export const generateOrConstraint = (list, field) => {
  let count
  return list.reduce((result, value) => {
    count++

    if (count == 1) return `${field}=${value}`

    return `${result} OR ${field}=${value}`
  }, '')
}