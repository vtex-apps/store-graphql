import FormData from 'form-data'
import ResolverError from '../../errors/resolverError'

export const uploadAttachment = async (args, ctx) => {
  const { dataSources: { document } } = ctx
  const { acronym, documentId, field, file } = args
  const { stream, filename, mimetype } = await file
  const buffer = await new Promise((resolve, reject) => {
    const bufs = []
    stream.on('data', d => bufs.push(d))
    stream.on('end', () => {
      resolve(Buffer.concat(bufs))
    })
    stream.on('error', reject)
  }) as Buffer

  const formData = new FormData()

  formData.append(field, buffer, { filename, contentType: mimetype, knownLength: buffer.byteLength })

  const response = await document.uploadAttachment(acronym, documentId, field, formData)
  
  if (response) {
    throw new ResolverError(response, 500)
  }

  return { filename, mimetype }
}
