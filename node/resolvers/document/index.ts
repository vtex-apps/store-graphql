import {
  retrieveDocument,
  retrieveDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} from './services'

export const queries = {
  documents: async (_: any, args: DocumentsArgs, context: Context) => {
    const response = await retrieveDocuments({ args, context })
    console.log(response)
    return response
  },

  document: async (_: any, args: DocumentArgs, context: Context) =>
    retrieveDocument({ args, context }),
}

export const mutations = {
  createDocument: async (_: any, args: CreateDocumentArgs, context: Context) =>
    createDocument({ args, context }),

  updateDocument: async (_: any, args: UpdateDocumentArgs, context: Context) =>
    updateDocument({ args, context }),

  deleteDocument: async (_: any, args: DeleteDocumentArgs, context: Context) =>
    deleteDocument({ args, context }),
}
