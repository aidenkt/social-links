import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'

/**
 * "Sign in with KT Account": the OpenID Connect authorization code flow with PKCE (S256)
 * against KT Accounts, run entirely on this server as a confidential client. Each step
 * takes what it needs as arguments (fetch and the key set too), so tests can run it
 * against a local mock of KT Accounts.
 */

export const SCOPE = 'openid profile permissions'
export const LOGIN_TTL_S = 600
export const SESSION_TTL_S = 7 * 24 * 3600

const ACCESS_TOKEN_RE = /^kto_[A-Za-z0-9_-]{43}$/
const CODE_RE = /^ktx_[A-Za-z0-9_-]{43}$/
const STATE_RE = /^[A-Za-z0-9_-]{43}$/

export interface LoginState {
  state: string
  nonce: string
  verifier: string
  redirectUri: string
}

export function authorizeUrl(issuer: string, clientId: string, login: LoginState, challenge: string): string {
  const u = new URL('/oauth/authorize', issuer)
  u.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: login.redirectUri,
    response_type: 'code',
    scope: SCOPE,
    state: login.state,
    nonce: login.nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  }).toString()
  return u.href
}

/** The login cookie's content, checked field by field. */
export function parseLoginState(raw: Record<string, unknown> | null): LoginState | null {
  if (!raw) return null
  const { state, nonce, verifier, redirectUri } = raw
  if (typeof state !== 'string' || !STATE_RE.test(state)) return null
  if (typeof nonce !== 'string' || !STATE_RE.test(nonce)) return null
  if (typeof verifier !== 'string' || !/^[A-Za-z0-9_-]{43,128}$/.test(verifier)) return null
  if (typeof redirectUri !== 'string' || redirectUri.length > 512) return null
  return { state, nonce, verifier, redirectUri }
}

export type CallbackCheck =
  | { ok: true; code: string }
  | { ok: false; reason: 'denied' | 'bad_request' | 'state_mismatch' | 'issuer_mismatch' }

/**
 * The query KT Accounts sent back. RFC 9207: KT always adds `iss`; when present it must be
 * our issuer (mix-up defence). Every parameter may appear at most once.
 */
export function checkCallback(params: URLSearchParams, login: LoginState, issuer: string): CallbackCheck {
  for (const k of ['code', 'state', 'iss', 'error']) if (params.getAll(k).length > 1) return { ok: false, reason: 'bad_request' }
  const iss = params.get('iss')
  if (iss !== null && iss !== issuer) return { ok: false, reason: 'issuer_mismatch' }
  const state = params.get('state')
  if (state === null || state !== login.state) return { ok: false, reason: 'state_mismatch' }
  if (params.get('error') !== null) return { ok: false, reason: 'denied' }
  const code = params.get('code')
  if (!code || !CODE_RE.test(code)) return { ok: false, reason: 'bad_request' }
  return { ok: true, code }
}

export interface TokenResult {
  accessToken: string
  idToken: string
}

/** RFC 6749 2.3.1: both halves of Basic credentials are form-urlencoded first. */
function basicAuth(id: string, secret: string): string {
  const f = (s: string) => encodeURIComponent(s).replace(/%20/g, '+')
  return `Basic ${btoa(`${f(id)}:${f(secret)}`)}`
}

export async function exchangeCode(
  opts: { issuer: string; clientId: string; clientSecret: string; code: string; login: LoginState },
  fetchImpl: typeof fetch = fetch
): Promise<TokenResult | null> {
  const res = await fetchImpl(new URL('/oauth/token', opts.issuer), {
    method: 'POST',
    headers: {
      authorization: basicAuth(opts.clientId, opts.clientSecret),
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: opts.code,
      redirect_uri: opts.login.redirectUri,
      code_verifier: opts.login.verifier,
    }).toString(),
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) return null
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return null
  const { access_token, id_token, token_type } = body
  if (typeof token_type !== 'string' || token_type.toLowerCase() !== 'bearer') return null
  if (typeof access_token !== 'string' || !ACCESS_TOKEN_RE.test(access_token)) return null
  if (typeof id_token !== 'string' || id_token.length > 8192) return null
  return { accessToken: access_token, idToken: id_token }
}

const jwksCache = new Map<string, JWTVerifyGetKey>()
export function remoteJwks(issuer: string): JWTVerifyGetKey {
  let k = jwksCache.get(issuer)
  if (!k) {
    k = createRemoteJWKSet(new URL('/oauth/jwks.json', issuer), { timeoutDuration: 10_000, cooldownDuration: 30_000 })
    jwksCache.set(issuer, k)
  }
  return k
}

export interface Person {
  sub: string
  name: string
  handle: string | null
  picture: string | null
  isOwner: boolean
}

/**
 * Check the ID token: ES256 signature from a key in KT's JWKS, `iss`, `aud` (and `azp`
 * when present) equal to ours, the `nonce` we sent, not expired. Returns the person, or
 * null when anything is off.
 */
export async function verifyIdToken(
  idToken: string,
  opts: { issuer: string; clientId: string; nonce: string; keys: JWTVerifyGetKey; now?: number }
): Promise<Person | null> {
  try {
    const { payload } = await jwtVerify(idToken, opts.keys, {
      issuer: opts.issuer,
      audience: opts.clientId,
      algorithms: ['ES256'],
      requiredClaims: ['sub', 'exp', 'iat', 'nonce'],
      clockTolerance: 30,
      maxTokenAge: '1h',
      currentDate: opts.now === undefined ? undefined : new Date(opts.now),
    })
    if (payload.nonce !== opts.nonce) return null
    if (Array.isArray(payload.aud) && payload.aud.length !== 1) return null
    if (payload.azp !== undefined && payload.azp !== opts.clientId) return null
    if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 128) return null
    return {
      sub: payload.sub,
      name: typeof payload.name === 'string' ? payload.name.slice(0, 100) : '',
      handle: typeof payload.preferred_username === 'string' ? payload.preferred_username.slice(0, 40) : null,
      picture: httpsUrl(payload.picture, opts.issuer),
      // Strictly the boolean true: a string "true" or a missing claim is not the owner.
      isOwner: payload.is_owner === true,
    }
  } catch {
    return null
  }
}

/** Only a picture served by KT Accounts itself is kept (it is shown in an <img>). */
function httpsUrl(v: unknown, issuer: string): string | null {
  if (typeof v !== 'string' || v.length > 512) return null
  try {
    const u = new URL(v)
    return u.origin === issuer ? u.href : null
  } catch {
    return null
  }
}

export interface IdentityReport {
  displayName: string
  handle: string
  profileUrl: string
  picture: Uint8Array
}

/**
 * Tell KT Accounts who the person is on aiden.social (PUT /oauth/identity, then the picture
 * as raw bytes to PUT /oauth/identity/picture). Best effort: a failure is reported back but
 * never blocks the sign-in. The access token is used here and then dropped.
 */
export async function reportIdentity(
  issuer: string,
  accessToken: string,
  identity: IdentityReport,
  fetchImpl: typeof fetch = fetch
): Promise<{ identity: number; picture: number }> {
  const auth = { authorization: `Bearer ${accessToken}` }
  const common = { cache: 'no-store' as const, redirect: 'error' as const }
  const status = async (p: Promise<Response>) => {
    try {
      return (await p).status
    } catch {
      return 0
    }
  }
  const identityStatus = await status(
    fetchImpl(new URL('/oauth/identity', issuer), {
      ...common,
      method: 'PUT',
      headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: identity.displayName, handle: identity.handle, profileUrl: identity.profileUrl }),
      signal: AbortSignal.timeout(8_000),
    })
  )
  const pictureStatus = await status(
    fetchImpl(new URL('/oauth/identity/picture', issuer), {
      ...common,
      method: 'PUT',
      headers: { ...auth, 'content-type': 'image/webp' },
      body: identity.picture as unknown as BodyInit,
      signal: AbortSignal.timeout(8_000),
    })
  )
  return { identity: identityStatus, picture: pictureStatus }
}
