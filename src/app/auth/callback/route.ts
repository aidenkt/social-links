import type { NextRequest } from 'next/server'
import { readAuthConfig } from '../../../lib/auth/config'
import { messagePage, MESSAGES, redirectTo } from '../../../lib/auth/http'
import { checkCallback, exchangeCode, parseLoginState, remoteJwks, reportIdentity, verifyIdToken } from '../../../lib/auth/oidc'
import { OWNER_PICTURE_WEBP_BASE64 } from '../../../lib/auth/owner-picture'
import { unseal } from '../../../lib/auth/seal'
import { clearLoginCookie, LOGIN_COOKIE, startSession } from '../../../lib/auth/session'
import { OWNER_PROFILE } from '../../../lib/owner-profile'

export const dynamic = 'force-dynamic'

/**
 * GET /auth/callback: KT Accounts sends the browser back here with ?code&state&iss.
 * The login cookie must match (state), the code is exchanged on this server with the
 * client secret and PKCE verifier, and the ID token is verified (signature, iss, aud,
 * nonce, exp). Only the owner (is_owner === true) gets a session; anyone else sees a short
 * refusal and gets nothing. For the owner, aiden.social's profile is reported to KT
 * Accounts with the access token, which is then dropped.
 */
export async function GET(req: NextRequest) {
  const config = readAuthConfig()
  if (!config) return messagePage(MESSAGES.unavailable, { retry: false, status: 503 })

  const fail = (message: string, retry: boolean, status = 400) => {
    const res = messagePage(message, { retry, status })
    clearLoginCookie(res)
    return res
  }

  const login = parseLoginState(await unseal(config.sessionSecret, 'login', req.cookies.get(LOGIN_COOKIE)?.value))
  if (!login) return fail(MESSAGES.retry, true)
  const check = checkCallback(req.nextUrl.searchParams, login, config.issuer)
  if (!check.ok) return fail(MESSAGES.retry, true)

  const tokens = await exchangeCode({ ...config, code: check.code, login }).catch(() => null)
  if (!tokens) return fail(MESSAGES.retry, true)
  const person = await verifyIdToken(tokens.idToken, {
    issuer: config.issuer,
    clientId: config.clientId,
    nonce: login.nonce,
    keys: remoteJwks(config.issuer),
  })
  if (!person) return fail(MESSAGES.retry, true)
  if (!person.isOwner) return fail(MESSAGES.notOwner, false, 403)

  const report = await reportIdentity(config.issuer, tokens.accessToken, {
    ...OWNER_PROFILE,
    picture: Uint8Array.from(Buffer.from(OWNER_PICTURE_WEBP_BASE64, 'base64')),
  })
  if (report.identity !== 200 || report.picture !== 201) {
    console.warn('[kt-signin] identity report incomplete', report)
  }

  const res = redirectTo(new URL('/', req.nextUrl.origin))
  clearLoginCookie(res)
  await startSession(res, config.sessionSecret, { sub: person.sub, ktPicture: person.picture })
  return res
}
