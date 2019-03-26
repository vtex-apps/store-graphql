export * from './object'
export * from './cookie'

export function generateRandomName() {
  return (1 + Math.random()).toString(36).substring(2)
}
