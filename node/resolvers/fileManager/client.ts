import {
  AppClient,
  IOContext,
  InstanceOptions,
  ResolverError,
  NotFoundError,
} from '@vtex/api'
import { pathEq, path } from 'ramda'

const appId = process.env.VTEX_APP_ID
const [runningAppName] = appId ? appId.split('@') : ['']

const routes = {
  Assets: () => `/assets/${runningAppName}`,
  FileUpload: (bucket: string, path: string) =>
    `${routes.Assets()}/save/${bucket}/${path}`,
  FileUrl: (bucket: string, path: string) =>
    `${routes.Assets()}/route/${bucket}/${path}`,
  FileDelete: (bucket: string, path: string) =>
    `${routes.Assets()}/delete/${bucket}/${path}`,
  File: (
    path: string,
    width: number,
    height: number,
    aspect: boolean,
    bucket: string
  ) =>
    `${routes.Assets()}/${bucket}/${path}?width=${width}&height=${height}&aspect=${aspect}`,
}

export default class FileManagerClient extends AppClient {
  constructor(ioContext: IOContext, options: InstanceOptions = {}) {
    super('vtex.file-manager', ioContext, options)

    if (runningAppName === '') {
      throw new ResolverError(
        `Invalid path to access FileManger. Variable VTEX_APP_ID is not available.`
      )
    }
  }

  getFile = async (
    path: string,
    width: number,
    height: number,
    aspect: boolean,
    bucket: string
  ) => {
    try {
      return await this.http.get(
        routes.File(path, width, height, aspect, bucket)
      )
    } catch (e) {
      if (e.statusCode === 404 || pathEq(['response', 'status'], 404, e)) {
        throw new NotFoundError(e)
      } else {
        throw e
      }
    }
  }

  getFileUrl = async (path: string, bucket: string) => {
    try {
      return await this.http.get(routes.FileUrl(bucket, path))
    } catch (e) {
      if (e.statusCode === 404 || pathEq(['response', 'status'], 404, e)) {
        throw new NotFoundError(e)
      } else {
        throw e
      }
    }
  }

  saveFile = async (file: IncomingFile, stream: any, bucket: string) => {
    try {
      const { filename, encoding, mimetype } = file
      const headers = {
        'Content-Type': mimetype,
        'Content-Encoding': encoding,
      }
      return await this.http.put<string>(
        routes.FileUpload(bucket, filename),
        stream,
        {
          headers,
        }
      )
    } catch (e) {
      const status = e.statusCode || path(['response', 'status'], e) || 500
      throw new ResolverError(e, status)
    }
  }

  deleteFile = async (path: string, bucket: string) => {
    try {
      return await this.http.delete(routes.FileDelete(bucket, path))
    } catch (e) {
      if (e.statusCode === 404 || pathEq(['response', 'status'], 404, e)) {
        throw new NotFoundError(e)
      } else {
        throw e
      }
    }
  }
}
