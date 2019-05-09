import { ResolverError } from '@vtex/api'
import { compose, map, union, prop, replace } from 'ramda'
import FormData from 'form-data'

import { generateRandomName } from '../../utils'
import { mapKeyValues, parseFieldsToJson } from '../../utils/object'

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
  args: { acronym, fields, id },
  context: {
    clients: { masterdata },
  },
}: {
  args: DocumentArgs
  context: Context
}) {
  return masterdata.getDocument(acronym, id, fields).then(data =>{
    console.log(data)
    return {
    id,
    fields: mapKeyValues(data),
  }
  })
}

export function retrieveDocuments({
  args: { acronym, fields, page, pageSize, where },
  context: {
    clients: { masterdata },
  },
}: {
  args: DocumentsArgs
  context: Context
}) {
  const fieldsWithId = union(fields, ['id'])

  return masterdata.searchDocuments(acronym, fieldsWithId, where, {
    page,
    pageSize,
  })
    .then(map((document: any) => ({id: document.id, fields: mapKeyValues(document)})))
}

export function createDocument({
  args: { acronym, document: { fields } },
  context : {
    clients: { masterdata }
  },
}: {
  args: CreateDocumentArgs
  context: Context
}) {
  return masterdata.createDocument(acronym, parseFieldsToJson(fields))
    .then(data => ({ id: getCleanId(acronym, data), href: prop('Href', data)}))
}


export function updateDocument({
  args: { acronym, document: { fields }, id },
  context : {
    clients: { masterdata }
  },
}: {
  args: UpdateDocumentArgs
  context: Context
}) {
  return masterdata.updateDocument(acronym, id, parseFieldsToJson(fields))
    .then(() => ({ id }))
}

export function deleteDocument({
  args: { acronym, id },
  context : {
    clients: { masterdata }
  },
}: {
  args: DeleteDocumentArgs
  context: Context
}) {
  return masterdata.deleteDocument(acronym, id)
}

function getFileExtension(fileName: any) {
  return fileName.match(/\.[0-9a-z]+$/i)[0]
}

function getCleanId(acronym: string, data: {Id: string}) {
  return compose<any, any, any>(
    replace(new RegExp(`${acronym}-`), ''),
    prop('Id')
  )(data)
}
