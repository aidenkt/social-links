import type { NextRequest } from 'next/server'
import { readAuthConfig } from '../../lib/auth/config'
import { messagePage, MESSAGES, redirectTo } from '../../lib/auth/http'
import { authorizeUrl, LOGIN_TTL_S } from '../../lib/auth/oidc'
import { pkceChallenge, randomToken, seal } from '../../lib/auth/seal'
import { readSession, setLoginCookie } from '../../lib/auth/session'

export const dynamic = 'force-dynamic'

/**
 * GET /login (not linked anywhere): start "Sign in with KT Account". Already signed in as
 * the owner: straight back to the page. Otherwise a fresh state, nonce and PKCE verifier go
 * into a sealed 10-minute cookie, and the browser goes to KT Accounts.
 */
export async function GET(req: NextRequest) {
  const config = readAuthConfig()
  if (!config) return messagePage(MESSAGES.unavailable, { retry: false, status: 503 })
  if (await readSession(req, config.sessionSecret)) return redirectTo(new URL('/', req.nextUrl.origin))

  const login = {
    state: randomToken(32),
    nonce: randomToken(32),
    verifier: randomToken(32),
    redirectUri: config.redirectUriOverride ?? new URL('/auth/callback', req.nextUrl.origin).href,
  }
  const res = redirectTo(authorizeUrl(config.issuer, config.clientId, login, await pkceChallenge(login.verifier)))
  setLoginCookie(res, await seal(config.sessionSecret, 'login', { ...login }, LOGIN_TTL_S))
  return res
}
