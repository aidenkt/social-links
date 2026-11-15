import 'server-only'
import type { NextRequest, NextResponse } from 'next/server'
import { LOGIN_TTL_S, SESSION_TTL_S } from './oidc'
import { randomToken, seal, unseal } from './seal'

/**
 * Cookies (all Secure, SameSite=Lax, Path=/, __Host- prefixed so no subdomain can set them):
 *   __Host-as.login    sealed {state, nonce, verifier, redirectUri}, 10 minutes, HttpOnly
 *   __Host-as.session  sealed {sub, ktPicture, csrf}, 7 days, HttpOnly. No tokens.
 *   __Host-as.owner    "1", readable by the page: only a hint to ask /auth/session, grants nothing
 */
export const LOGIN_COOKIE = '__Host-as.login'
export const SESSION_COOKIE = '__Host-as.session'
export const HINT_COOKIE = '__Host-as.owner'

export interface OwnerSession {
  sub: string
  ktPicture: string | null
  csrf: string
}

const base = { secure: true, sameSite: 'lax' as const, path: '/' }

export function setLoginCookie(res: NextResponse, value: string) {
  res.cookies.set(LOGIN_COOKIE, value, { ...base, httpOnly: true, maxAge: LOGIN_TTL_S })
}

export function clearLoginCookie(res: NextResponse) {
  res.cookies.set(LOGIN_COOKIE, '', { ...base, httpOnly: true, maxAge: 0 })
}

export async function startSession(res: NextResponse, secret: string, s: Omit<OwnerSession, 'csrf'>) {
  const value = await seal(secret, 'session', { sub: s.sub, kp: s.ktPicture, csrf: randomToken(32) }, SESSION_TTL_S)
  res.cookies.set(SESSION_COOKIE, value, { ...base, httpOnly: true, maxAge: SESSION_TTL_S })
  res.cookies.set(HINT_COOKIE, '1', { ...base, httpOnly: false, maxAge: SESSION_TTL_S })
}

export function endSession(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', { ...base, httpOnly: true, maxAge: 0 })
  res.cookies.set(HINT_COOKIE, '', { ...base, httpOnly: false, maxAge: 0 })
}

export async function readSession(req: NextRequest, secret: string): Promise<OwnerSession | null> {
  const p = await unseal(secret, 'session', req.cookies.get(SESSION_COOKIE)?.value)
  if (!p) return null
  if (typeof p.sub !== 'string' || !p.sub) return null
  if (typeof p.csrf !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(p.csrf)) return null
  return { sub: p.sub, ktPicture: typeof p.kp === 'string' ? p.kp : null, csrf: p.csrf }
}
