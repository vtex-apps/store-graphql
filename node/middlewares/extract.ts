import parse from 'co-body'
import { LRUCache } from '@vtex/api'
import fetch from 'isomorphic-unfetch'

const storage = new LRUCache<string, string | undefined>({
  max: 1e3,
})

interface PersistedQuery extends Query {
  extensions: {
    persistedQuery: {
      version: string
      sha256Hash: string
      storage: string
    }
  }
}

const isPersistedQuery = (query: any): query is PersistedQuery =>
  !!query.extensions

const parseString = (x: any) => (typeof x === 'string' ? JSON.parse(x) : x)

export default async function extract(ctx: Context, next: () => Promise<void>) {
  const {
    vtex: { authToken },
  } = ctx

  const rawQuery =
    ctx.request.method === 'POST' ? await parse.json(ctx) : ctx.request.query

  const query = {
    query: rawQuery.query,
    operationName: rawQuery.operationName,
    variables: parseString(rawQuery.variables),
    extensions: parseString(rawQuery.extensions),
  }

  // We have a persisted query in here. We need to translate it to a query
  // so graphql can understand and run it
  if (isPersistedQuery(query)) {
    const {
      extensions: {
        persistedQuery: { sha256Hash },
      },
    } = query

    const maybeQuery = storage.get(sha256Hash)

    // Query is already in our local storage. Just translate i
    if (maybeQuery) {
      query.query = maybeQuery
    }
    // Query is somewhere else. We need to fetch it and than try to translate it
    else {
      const storageHost = ctx.get('x-vtex-graphql-referer')
      const url = `http://${storageHost}/page-data/_graphql/persisted.graphql.json`

      // fetch persisted.json from remote
      const persisted = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-vtex-use-https': 'true',
          accept: 'application/json',
          Authorization: authToken,
        },
      }).then((res: any) => res.json())

      if (!persisted?.[sha256Hash]) {
        throw new Error(`URL ${url} does not contains hash ${sha256Hash}`)
      }

      // update local storage
      Object.keys(persisted).forEach(hash => {
        storage.set(hash, persisted[hash])
      })

      // set query and continue
      query.query = persisted[sha256Hash]
    }

    // Delete extensions so apollo does not try to parse the persisted query again
    delete query.extensions
  }

  ctx.state.query = query

  await next()
}
