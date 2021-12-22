const appName = process.env.VTEX_APP_ID as string

interface StoreGraphQLSettings {
  trustedAccounts?: string[]
}

export const allowedAccounts = async (
  context: Context,
  tokenAccount: string
) => {
  // check if account exists in allow list and the user token account exists for that account.
  const trustedAccounts: string[] =
    ((await context.clients.apps.getAppSettings(
      appName
    )) as StoreGraphQLSettings).trustedAccounts ?? []

  return trustedAccounts.includes(tokenAccount)
}
