import { describe, expect, it } from 'vitest'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWK } from 'jose'
import {
  authorizeUrl,
  checkCallback,
  exchangeCode,
  parseLoginState,
  reportIdentity,
  verifyIdToken,
  type LoginState,
} from '../src/lib/auth/oidc'
import { pkceChallenge, randomToken, safeEqual, seal, unseal } from '../src/lib/auth/seal'
import { OWNER_PICTURE_WEBP_BASE64 } from '../src/lib/auth/owner-picture'

const ISS = 'https://accounts.example.test'
const CLIENT = 'kt_client_123'
const login: LoginState = {
  state: randomToken(32),
  nonce: randomToken(32),
  verifier: randomToken(32),
  redirectUri: 'https://aiden.social/auth/callback',
}

async function keys() {
  const { publicKey, privateKey } = await generateKeyPair('ES256', { extractable: true })
  const jwk: JWK = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'ES256', use: 'sig' }
  return { privateKey, jwks: createLocalJWKSet({ keys: [jwk] }), jwk }
}

async function idToken(privateKey: CryptoKey, claims: Record<string, unknown>, opts: { iss?: string; aud?: string; exp?: number } = {}) {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({ nonce: login.nonce, ...claims })
    .setProtectedHeader({ alg: 'ES256', kid: 'k1' })
    .setIssuer(opts.iss ?? ISS)
    .setAudience(opts.aud ?? CLIENT)
    .setSubject('user_1')
    .setIssuedAt(now)
    .setExpirationTime(opts.exp ?? now + 3600)
    .sign(privateKey)
}

describe('authorize request', () => {
  it('asks for openid profile permissions with PKCE S256, state and nonce', async () => {
    const u = new URL(authorizeUrl(ISS, CLIENT, login, await pkceChallenge(login.verifier)))
    expect(u.origin + u.pathname).toBe(`${ISS}/oauth/authorize`)
    const q = u.searchParams
    expect(q.get('scope')).toBe('openid profile permissions')
    expect(q.get('response_type')).toBe('code')
    expect(q.get('code_challenge_method')).toBe('S256')
    expect(q.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(q.get('state')).toBe(login.state)
    expect(q.get('nonce')).toBe(login.nonce)
    expect(q.get('redirect_uri')).toBe(login.redirectUri)
  })

  it('PKCE challenge is the RFC 7636 S256 of the verifier', async () => {
    // RFC 7636 appendix B
    expect(await pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
  })
})

describe('callback query', () => {
  const q = (o: Record<string, string>) => new URLSearchParams(o)
  const code = `ktx_${'a'.repeat(43)}`
  it('accepts a matching state and issuer', () => {
    expect(checkCallback(q({ code, state: login.state, iss: ISS }), login, ISS)).toEqual({ ok: true, code })
  })
  it('refuses a different state', () => {
    expect(checkCallback(q({ code, state: randomToken(32), iss: ISS }), login, ISS).ok).toBe(false)
  })
  it('refuses a different issuer (mix-up)', () => {
    expect(checkCallback(q({ code, state: login.state, iss: 'https://evil.test' }), login, ISS).ok).toBe(false)
  })
  it('refuses an error answer and repeated parameters', () => {
    expect(checkCallback(q({ error: 'access_denied', state: login.state, iss: ISS }), login, ISS)).toEqual({ ok: false, reason: 'denied' })
    const dup = new URLSearchParams(`code=${code}&code=${code}&state=${login.state}`)
    expect(checkCallback(dup, login, ISS).ok).toBe(false)
  })
  it('refuses a malformed code', () => {
    expect(checkCallback(q({ code: 'nope', state: login.state }), login, ISS).ok).toBe(false)
  })
})

describe('sealed cookies', () => {
  const secret = 'x'.repeat(40)
  it('round-trips and checks purpose, expiry, tampering and key', async () => {
    const t = await seal(secret, 'login', { ...login }, 600)
    expect(parseLoginState(await unseal(secret, 'login', t))).toEqual(login)
    expect(await unseal(secret, 'session', t)).toBeNull()
    expect(await unseal('y'.repeat(40), 'login', t)).toBeNull()
    expect(await unseal(secret, 'login', t, Date.now() + 601_000)).toBeNull()
    const parts = t.split('.')
    parts[3] = parts[3].slice(0, -2) + (parts[3].endsWith('AA') ? 'BB' : 'AA')
    expect(await unseal(secret, 'login', parts.join('.'))).toBeNull()
  })
  it('compares in constant time', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abc', 'abd')).toBe(false)
    expect(safeEqual('abc', 'abcd')).toBe(false)
  })
})

describe('ID token verification', () => {
  const opts = (k: Awaited<ReturnType<typeof keys>>) => ({ issuer: ISS, clientId: CLIENT, nonce: login.nonce, keys: k.jwks })

  it('accepts a good token and reads is_owner', async () => {
    const k = await keys()
    const p = await verifyIdToken(await idToken(k.privateKey, { is_owner: true, name: 'Aiden', preferred_username: 'aiden', picture: `${ISS}/media/a.webp`, azp: CLIENT }), opts(k))
    expect(p).toEqual({ sub: 'user_1', name: 'Aiden', handle: 'aiden', picture: `${ISS}/media/a.webp`, isOwner: true })
  })
  it('treats anything but boolean true as not the owner', async () => {
    const k = await keys()
    for (const v of [false, 'true', 1, undefined]) {
      const p = await verifyIdToken(await idToken(k.privateKey, { is_owner: v }), opts(k))
      expect(p?.isOwner).toBe(false)
    }
  })
  it('refuses a wrong nonce, audience, issuer, azp, or an expired token', async () => {
    const k = await keys()
    expect(await verifyIdToken(await idToken(k.privateKey, { nonce: randomToken(32), is_owner: true }), opts(k))).toBeNull()
    expect(await verifyIdToken(await idToken(k.privateKey, { is_owner: true }, { aud: 'other' }), opts(k))).toBeNull()
    expect(await verifyIdToken(await idToken(k.privateKey, { is_owner: true }, { iss: 'https://evil.test' }), opts(k))).toBeNull()
    expect(await verifyIdToken(await idToken(k.privateKey, { is_owner: true, azp: 'other' }), opts(k))).toBeNull()
    expect(await verifyIdToken(await idToken(k.privateKey, { is_owner: true }, { exp: Math.floor(Date.now() / 1000) - 120 }), opts(k))).toBeNull()
  })
  it('refuses a token signed by another key or with another algorithm', async () => {
    const k = await keys()
    const other = await keys()
    expect(await verifyIdToken(await idToken(other.privateKey, { is_owner: true }), opts(k))).toBeNull()
    const hs = await new SignJWT({ nonce: login.nonce, is_owner: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(ISS).setAudience(CLIENT).setSubject('user_1').setIssuedAt().setExpirationTime('1h')
      .sign(new TextEncoder().encode('k'.repeat(32)))
    expect(await verifyIdToken(hs, opts(k))).toBeNull()
    const none = `${btoa('{"alg":"none"}')}.${btoa(JSON.stringify({ iss: ISS, aud: CLIENT, sub: 'u', nonce: login.nonce, is_owner: true }))}.`
    expect(await verifyIdToken(none, opts(k))).toBeNull()
  })
  it('drops a picture that is not on KT Accounts', async () => {
    const k = await keys()
    const p = await verifyIdToken(await idToken(k.privateKey, { picture: 'https://evil.test/x.png' }), opts(k))
    expect(p?.picture).toBeNull()
  })
})

describe('token exchange', () => {
  const good = { access_token: `kto_${'b'.repeat(43)}`, token_type: 'Bearer', id_token: 'h.p.s', expires_in: 3600, scope: 'openid profile permissions' }
  it('sends Basic client credentials, the code, the redirect URI and the PKCE verifier', async () => {
    let seen: { url: string; init: RequestInit } | null = null
    const fake = (async (url: URL, init: RequestInit) => {
      seen = { url: String(url), init }
      return new Response(JSON.stringify(good), { status: 200, headers: { 'content-type': 'application/json' } })
    }) as unknown as typeof fetch
    const r = await exchangeCode({ issuer: ISS, clientId: CLIENT, clientSecret: 's e/c:ret', code: 'ktx_c', login }, fake)
    expect(r).toEqual({ accessToken: good.access_token, idToken: 'h.p.s' })
    expect(seen!.url).toBe(`${ISS}/oauth/token`)
    const h = seen!.init.headers as Record<string, string>
    expect(h.authorization).toBe(`Basic ${btoa(`${CLIENT}:s+e%2Fc%3Aret`)}`)
    const body = new URLSearchParams(String(seen!.init.body))
    expect(body.get('grant_type')).toBe('authorization_code')
    expect(body.get('code_verifier')).toBe(login.verifier)
    expect(body.get('redirect_uri')).toBe(login.redirectUri)
    expect(body.has('client_secret')).toBe(false)
  })
  it('a public client sends client_id in the form and no Authorization header', async () => {
    let seen: RequestInit | null = null
    const fake = (async (_url: URL, init: RequestInit) => {
      seen = init
      return new Response(JSON.stringify(good), { status: 200 })
    }) as unknown as typeof fetch
    expect(await exchangeCode({ issuer: ISS, clientId: CLIENT, clientSecret: null, code: 'ktx_c', login }, fake)).not.toBeNull()
    expect((seen!.headers as Record<string, string>).authorization).toBeUndefined()
    const body = new URLSearchParams(String(seen!.body))
    expect(body.get('client_id')).toBe(CLIENT)
    expect(body.get('code_verifier')).toBe(login.verifier)
  })
  it('refuses errors and odd token shapes', async () => {
    const reply = (status: number, b: unknown) => (async () => new Response(JSON.stringify(b), { status })) as unknown as typeof fetch
    const args = { issuer: ISS, clientId: CLIENT, clientSecret: 's', code: 'ktx_c', login }
    expect(await exchangeCode(args, reply(400, { error: 'invalid_grant' }))).toBeNull()
    expect(await exchangeCode(args, reply(200, { ...good, token_type: 'mac' }))).toBeNull()
    expect(await exchangeCode(args, reply(200, { ...good, access_token: 'short' }))).toBeNull()
  })
})

describe('identity report', () => {
  it('PUTs name, handle and profile URL as JSON, then a 512x512 WebP picture', async () => {
    const calls: { url: string; init: RequestInit }[] = []
    const fake = (async (url: URL, init: RequestInit) => {
      calls.push({ url: String(url), init })
      return new Response('{}', { status: String(url).endsWith('/picture') ? 201 : 200 })
    }) as unknown as typeof fetch
    const picture = Uint8Array.from(Buffer.from(OWNER_PICTURE_WEBP_BASE64, 'base64'))
    const token = `kto_${'c'.repeat(43)}`
    const r = await reportIdentity(ISS, token, { displayName: 'Aiden Tabrizi', handle: 'aidenkt', profileUrl: 'https://aiden.social/', picture }, fake)
    expect(r).toEqual({ identity: 200, picture: 201 })
    expect(calls[0].url).toBe(`${ISS}/oauth/identity`)
    expect(calls[0].init.method).toBe('PUT')
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ displayName: 'Aiden Tabrizi', handle: 'aidenkt', profileUrl: 'https://aiden.social/' })
    expect((calls[0].init.headers as Record<string, string>).authorization).toBe(`Bearer ${token}`)
    expect(calls[1].url).toBe(`${ISS}/oauth/identity/picture`)
    expect((calls[1].init.headers as Record<string, string>)['content-type']).toBe('image/webp')
  })
  it('the embedded picture is a plain 512x512 WebP under 400 KB', () => {
    const b = Buffer.from(OWNER_PICTURE_WEBP_BASE64, 'base64')
    expect(b.subarray(0, 4).toString('latin1')).toBe('RIFF')
    expect(b.subarray(8, 12).toString('latin1')).toBe('WEBP')
    expect(b.readUInt32LE(4)).toBe(b.length - 8)
    const chunk = b.subarray(12, 16).toString('latin1')
    expect(chunk).toBe('VP8 ')
    expect(b.readUInt16LE(26) & 0x3fff).toBe(512)
    expect(b.readUInt16LE(28) & 0x3fff).toBe(512)
    expect(b.length).toBeLessThan(400 * 1024)
  })
})
