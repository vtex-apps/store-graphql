export const incrementCounter = (
  name: string,
  attributes: Record<string, string>
) => {
  try {
    ;(global as any).diagnosticsMetrics?.incrementCounter(name, 1, attributes)
  } catch {
    return undefined
  }

  return undefined
}
