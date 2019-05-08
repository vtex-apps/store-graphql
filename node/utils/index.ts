export * from './object'
export * from './cookie'

export function generateRandomName() {
  return (1 + Math.random()).toString(36).substring(2)
}

export function getFileExtension(fileName: string) {
  return fileName.match(/\.[0-9a-z]+$/i)
    ? (fileName.match(/\.[0-9a-z]+$/i) as any[])[0]
    : undefined
}
