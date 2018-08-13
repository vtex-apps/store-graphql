import FormData from 'form-data'
import fetch from 'node-fetch'
import ResolverError from '../../errors/resolverError'
import paths from '../paths'

export const uploadAttachment = async (args, ioContext) => {
  const {authToken, account} = ioContext
  const {acronym, documentId, field, file} = args

  const {stream, filename, mimetype} = await file
  const buffer = await new Promise((resolve, reject) => {
    const bufs = []
    stream.on('data', d => bufs.push(d))
    stream.on('end', () => {
      resolve(Buffer.concat(bufs))
    })
    stream.on('error', reject)
  }) as Buffer

  const formData = new FormData()

  formData.append(field, buffer, {filename, contentType: mimetype, knownLength: buffer.byteLength})

  const response = await fetch(paths.attachment(account, acronym, documentId, field), {
    body: formData,
    headers: {
      'Proxy-Authorization': authToken,
      'VtexIdclientAutCookie': authToken,
      ...formData.getHeaders(),
    },
    method: 'POST',
  }).then(res => res.text())

  if (response) {
    throw new ResolverError(response, 500)
  }

  return {filename, mimetype}
}
