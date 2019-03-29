import FormData from 'form-data'

import ResolverError from '../../errors/resolverError'
import { generateRandomName } from '../../utils'

export const uploadAttachment = async (args: any, ctx: any) => {
  const {
    dataSources: { document },
  } = ctx
  const { acronym, documentId, field, file } = args
  const { createReadStream, filename, mimetype } = await file
  const buffer = (await new Promise((resolve, reject) => {
    const bufs: any[] = []
    const stream = createReadStream()
    stream.on('data', (d: any) => bufs.push(d))
    stream.on('end', () => {
      resolve(Buffer.concat(bufs))
    })
    stream.on('error', reject)
  })) as Buffer

  const formData = new FormData()

  const randomName = generateRandomName() + getFileExtension(filename)

  formData.append(field, buffer, {
    contentType: mimetype,
    filename: randomName,
    knownLength: buffer.byteLength,
  })

  const response = await document.uploadAttachment(
    acronym,
    documentId,
    field,
    formData
  )

  if (response) {
    throw new ResolverError(response, 500)
  }

  return { filename: randomName, mimetype }
}

function getFileExtension(fileName: any) {
  return fileName.match(/\.[0-9a-z]+$/i)[0]
}
