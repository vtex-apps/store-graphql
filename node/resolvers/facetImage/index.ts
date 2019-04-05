import { head } from 'ramda'
import ResolverError from '../../errors/resolverError'
import { acronymFacetImage, fields } from './util'

export const queries = {
  facetImages: async (
    _: any,
    { facetType, page = 1, pageSize = 15 }: any,
    context: any
  ) => {
    const {
      dataSources: { document },
    } = context
    const list = await document.searchDocumentsWithSchema(
      acronymFacetImage,
      fields,
      `facetType=${facetType}`,
      'facet-image-schema-v1',
      { page, pageSize }
    )
    return list
  },

  facetImage: async (_: any, { facetId, facetType }: any, context: any) => {
    const {
      dataSources: { document },
    } = context
    const list = await document.searchDocumentsWithSchema(
      acronymFacetImage,
      fields,
      `facetId=${facetId} AND facetType=${facetType}`,
      'facet-image-schema-v1',
      { page: 1, pageSize: 1 }
    )
    if (list.length < 1) {
      throw new ResolverError(
        `Image not found for document ${facetId} of type ${facetType}.`,
        404
      )
    }
    return head(list)
  },
}
