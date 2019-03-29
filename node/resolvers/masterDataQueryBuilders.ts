export const generateBetweenConstraint = (field: any, lowerLimit: any, upperLimit: any) => {
  return `(${field} between ${lowerLimit} and ${upperLimit})`
}

export const generateOrConstraint = (list: any, field: any) => {
  return `(${list.reduce((result: any, value: any) => {
    if (result === '') { return `${field}=${value}` }

    return `${result} OR ${field}=${value}`
  }, '')})`
}