import { ResolverError } from '@vtex/api'
import { union } from 'ramda'
import FormData from 'form-data'

import { generateRandomName } from '../../utils'
import { mapKeyValues } from '../../utils/object'

export async function uploadAttachment(args: any, ctx: Context) {
  const {
    clients: { masterdata },
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

  const response = await masterdata.uploadAttachment(
    acronym,
    documentId,
    field,
    formData
  )

  if (response) {
    throw new ResolverError(response)
  }

  return { filename: randomName, mimetype }
}

export function retrieveDocument({
  context: {
    clients: { masterdata },
  },
  args: { acronym, fields, id },
}: {
  context: Context
  args: DocumentArgs
}) {
  return masterdata.getDocument(acronym, id, fields).then(data => ({
    id: id,
    fields: mapKeyValues(data),
  }))
}

export function retrieveDocuments({
  args: { acronym, fields, page, pageSize, where },
  context: {
    clients: { masterdata },
  },
}: {
  context: Context
  args: DocumentsArgs
}) {
  const fieldsWithId = union(fields, ['id'])

  return masterdata.searchDocuments(acronym, fieldsWithId, where, {
    page,
    pageSize,
  })
}

function getFileExtension(fileName: any) {
  return fileName.match(/\.[0-9a-z]+$/i)[0]
}
