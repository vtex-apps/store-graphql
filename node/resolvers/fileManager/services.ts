import { IOContext } from '@vtex/api'

import { generateRandomName, getFileExtension } from '../../utils'
import FileManager from './client'

export async function getFile(
  ctx: IOContext,
  {
    path,
    width,
    height,
    aspect,
    bucket,
  }: {
    path: string
    width: number
    height: number
    aspect: boolean
    bucket: string
  }
) {
  const fileManager = new FileManager(ctx)

  return await fileManager.getFile(path, width, height, aspect, bucket)
}

export async function uploadFile(
  ctx: IOContext,
  { file, bucket }: { file: any; bucket: string }
) {
  const fileManager = new FileManager(ctx)
  const { createReadStream, mimetype, encoding, filename } = await file

  const buffer = (await new Promise((resolve, reject) => {
    const bufs: any[] = []
    const stream = createReadStream()
    stream.on('data', (d: any) => bufs.push(d))
    stream.on('end', () => {
      resolve(Buffer.concat(bufs))
    })
    stream.on('error', reject)
  })) as Buffer

  const randomName = generateRandomName() + getFileExtension(filename)

  const incomingFile = { filename: randomName, mimetype, encoding }

  return {
    encoding,
    mimetype,
    fileUrl: await fileManager.saveFile(incomingFile, buffer, bucket),
  }
}

export async function deleteFile(
  ctx: IOContext,
  { path, bucket }: { path: string; bucket: string }
) {
  const fileManager = new FileManager(ctx)

  await fileManager.deleteFile(path, bucket)

  return true
}
