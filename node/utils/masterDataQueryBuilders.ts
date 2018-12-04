export interface MasterDataArgs {
  schema: string
  where: string
  field: string
  type: string
  interval: string
  subAggregations: string
  subAggregationsOp: string
  fields: string
}

export const generateBetweenConstraint = (field, lowerLimit, upperLimit) => {
  return `(${field} between ${lowerLimit} and ${upperLimit})`
}

export const generateOrConstraint = (list, field) => {
  return `(${list.reduce((result, value) => {
    if (result === '') { return `${field}=${value}` }

    return `${result} OR ${field}=${value}`
  }, '')})`
}

const addQueryParam = ({ field, value }) => {
  return value ? `&${field}=${value}` : ''
}

export const generateQueryParams = ({ schema, where, field, type, interval, subAggregations, subAggregationsOp, fields }: MasterDataArgs)  => {
  const schemaField = addQueryParam({ field: '_schema', value: schema})
  const whereField = addQueryParam({ field: '_where', value: where})
  const fieldField = addQueryParam({ field: '_field', value: field})
  const typeField = addQueryParam({ field: '_type', value: type})
  const intervalField = addQueryParam({ field: '_interval', value: interval})
  const subAggregationsField = addQueryParam({field:'_sub_aggregations', value: subAggregations})
  const subAggregationsOpField = addQueryParam({field:'_sub_aggregation_operation', value: subAggregationsOp})
  const fieldsField = addQueryParam({ field: '_fields', value: fields})

  return schemaField + whereField + fieldField + typeField + intervalField + subAggregationsField + subAggregationsOpField + fieldsField
} 
