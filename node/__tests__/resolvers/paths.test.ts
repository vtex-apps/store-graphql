import paths from '../../resolvers/paths'

describe('VTEX ID paths attach ?an={account}', () => {
  const ACCOUNT = 'storecomponents'

  it('accessKeySignIn carries an=account', () => {
    expect(paths.accessKeySignIn(ACCOUNT)).toBe(
      'http://vtexid.vtex.com.br/api/vtexid/pub/authentication/accesskey/validate?an=storecomponents'
    )
  })

  it('classicSignIn carries an=account', () => {
    expect(paths.classicSignIn(ACCOUNT)).toBe(
      'http://vtexid.vtex.com.br/api/vtexid/pub/authentication/classic/validate?an=storecomponents'
    )
  })

  it('setPassword carries an=account', () => {
    expect(paths.setPassword(ACCOUNT)).toBe(
      'http://vtexid.vtex.com.br/api/vtexid/pub/authentication/classic/setpassword?an=storecomponents'
    )
  })

  it('sendEmailVerification carries an=account', () => {
    expect(paths.sendEmailVerification(ACCOUNT)).toBe(
      'http://vtexid.vtex.com.br/api/vtexid/pub/authentication/accesskey/send?an=storecomponents'
    )
  })

  it('getUser keeps scope and adds an', () => {
    const url = paths.getUser(ACCOUNT)

    expect(url).toContain('scope=storecomponents')
    expect(url).toContain('an=storecomponents')
  })

  it('sessionToken keeps accountName and does NOT add an (relative callbackUrl/returnUrl trip backend account-host validation)', () => {
    const url = paths.sessionToken(ACCOUNT, ACCOUNT, '/foo', '/bar')

    expect(url).toContain('accountName=storecomponents')
    expect(url).not.toContain('an=')
    expect(url).toContain('callbackUrl=/foo')
    expect(url).toContain('returnUrl=/bar')
  })

  it('loginSessions and logOutFromSession remain unchanged (regression guard)', () => {
    expect(paths.loginSessions(ACCOUNT, ACCOUNT)).toContain(
      'an=storecomponents'
    )
    expect(
      paths.logOutFromSession({
        scope: ACCOUNT,
        account: ACCOUNT,
        sessionId: 'abc',
      })
    ).toContain('an=storecomponents')
  })
})
