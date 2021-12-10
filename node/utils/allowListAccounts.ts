export type AccountName = 'drogariasaopaulo' | 'fabula' | 'animale'

const AccountMapAllowList = new Map<AccountName, Set<string>>()

AccountMapAllowList.set('drogariasaopaulo', new Set(['drogariasp']))
AccountMapAllowList.set('fabula', new Set(['lojafabula']))
AccountMapAllowList.set('animale', new Set(['lojaanimale']))

export const allowedAccounts = (account: AccountName, tokenAccount: string) => {
  // check if account exists in allow list and the user token account exists for that account.
  return (
    AccountMapAllowList.has(account) &&
    AccountMapAllowList.get(account)?.has(tokenAccount)
  )
}
