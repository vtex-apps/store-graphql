import {
  AppGraphQLClient,
  IOContext,
  InstanceOptions,
  GraphQLResponse,
  Serializable,
} from '@vtex/api'

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

  constructor(message: string, graphQLErrors: any[]) {
    super(message)
    this.graphQLErrors = graphQLErrors
  }
}

export function throwOnGraphQLErrors<T extends Serializable>(message: string) {
  return function maybeGraphQLResponse(response: GraphQLResponse<T>) {
    // eslint-disable-next-line no-self-compare
    if (response?.errors?.length || 0 > 0) {
      throw new CustomGraphQLError(message, response.errors!)
    }

    return response
  }
}

export class Rewriter extends AppGraphQLClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super('vtex.rewriter@1.x', context, {
      ...options,
      headers: {
        ...options?.headers,
      },
    })
  }

  public getRoute = async (id: string, type: string, bindingId: string) => {
    const responseData = await this.graphql
      .query<GetRoutesResponse, { id: string; type: string }>(
        {
          query: getRouteQuery,
          variables: { id, type },
        },
        {
          metric: 'search-get-route',
        }
      )
      .then(throwOnGraphQLErrors('Error getting route data from vtex.rewriter'))
      .then((data) => {
        return data.data!.internal.routes
      })

    return responseData.find((route) => route.binding === bindingId)?.route
  }
}
