import { GraphQLObjectType, GraphQLNonNull, GraphQLSchema } from 'graphql'
import { addTypes, modifyObjectFields } from '@graphql-tools/utils'

const EMTPY_OBJ = {}
const noop = () => EMTPY_OBJ

export class NamespaceUnderFieldTransform {
  constructor(protected typeName: string, protected fieldName: string) {}

  public transformSchema(schema: GraphQLSchema): GraphQLSchema {
    const queryType = schema.getQueryType()

    if (!queryType) {
      return schema
    }

    const queryConfig = queryType.toConfig()
    const nestedQuery = new GraphQLObjectType({
      ...queryConfig,
      name: this.typeName,
    })

    const newSchema = addTypes(schema, [nestedQuery])
    const newRootFieldConfigMap = {
      [this.fieldName]: {
        type: new GraphQLNonNull(nestedQuery),
        resolve: noop,
      },
    }

    const [transformedSchema] = modifyObjectFields(
      newSchema,
      queryConfig.name,
      () => true,
      newRootFieldConfigMap
    )

    return transformedSchema
  }
}
