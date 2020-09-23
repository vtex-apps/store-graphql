import { AppGraphQLClient, IOContext, InstanceOptions, GraphQLResponse, Serializable } from "@vtex/api"

const getRouteQuery = `query GetRoute($id: String!, $type: String!) {
  internal {
    routes(locator: {id:$id, type:$type}) {
      route
      binding
    }
  }
}
`

interface Route {
  route: string
  binding: string
}

interface GetRoutesResponse {
  internal: {
    routes: Route[]
  }
}

class CustomGraphQLError extends Error {
  public graphQLErrors: any

  public constructor(message: string, graphQLErrors: any[]) {
    super(message)
    this.graphQLErrors = graphQLErrors
  }
}
export function throwOnGraphQLErrors<T extends Serializable>(message: string) {
  return function maybeGraphQLResponse(response: GraphQLResponse<T>) {
    if (response && response.errors && response.errors.length > 0) {
      throw new CustomGraphQLError(message, response.errors)
    }

    return response
  }
}

export class Rewriter extends AppGraphQLClient {
  public constructor(context: IOContext, options?: InstanceOptions) {
    super('vtex.rewriter@1.x', context, {
      ...options,
      headers: {
        ...options?.headers,
      }
    })
  }

  public getRoute = async (id: string, type: string, bindingId: string) => {
    const data = await this.graphql.query<GetRoutesResponse, { id: string, type: string }>({
      query: getRouteQuery,
      variables: { id, type },
    },
      {
        metric: 'search-get-route'
      }
    )
      .then(throwOnGraphQLErrors('Error getting route data from vtex.rewriter'))
      .then(data => {
        return data.data!.internal.routes
      })

    return data.find(route => route.binding === bindingId)?.route
  }
}
