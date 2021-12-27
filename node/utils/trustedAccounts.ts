const appName = process.env.VTEX_APP_ID as string

interface StoreGraphQLSettings {
  trustedAccounts?: string[]
}

export const isTrustedAccount = async (
  context: Context,
  tokenAccount: string
) => {
  const trustedAccounts: string[] =
    ((await context.clients.apps.getAppSettings(
      appName
    )) as StoreGraphQLSettings).trustedAccounts ?? []

  return trustedAccounts.includes(tokenAccount)
}
