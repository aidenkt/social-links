import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { exportJWK, generateKeyPair, SignJWT, type JWK } from 'jose'

/**
 * The route handlers end to end against a fake KT Accounts (global fetch stubbed):
 * /login -> KT authorize -> /auth/callback -> session -> /auth/session -> /auth/logout.
 */
const ISS = 'https://accounts.example.test'
const SITE = 'https://aiden.social'
const env = { KT_CLIENT_ID: 'ktc_puMtEsGWmWlUFKZNpRLsWA', KT_CLIENT_SECRET: '', SESSION_SECRET: 's'.repeat(48), KT_ACCOUNTS_ORIGIN: ISS }

let privateKey: CryptoKey
let jwk: JWK
let owner = true
let calls: { url: string; init?: RequestInit }[] = []
let lastNonce = ''

beforeAll(async () => {
  const kp = await generateKeyPair('ES256', { extractable: true })
  privateKey = kp.privateKey
  jwk = { ...(await exportJWK(kp.publicKey)), kid: 'k1', alg: 'ES256', use: 'sig' }
})

beforeEach(() => {
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
  owner = true
  calls = []
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input)
    calls.push({ url, init })
    if (url === `${ISS}/oauth/jwks.json`) return Response.json({ keys: [jwk] })
    if (url === `${ISS}/oauth/token`) {
      const now = Math.floor(Date.now() / 1000)
      const id = await new SignJWT({ nonce: lastNonce, is_owner: owner, name: 'KT Name', preferred_username: 'kt', picture: `${ISS}/media/p.webp` })
        .setProtectedHeader({ alg: 'ES256', kid: 'k1' })
        .setIssuer(ISS).setAudience(env.KT_CLIENT_ID).setSubject('user_1').setIssuedAt(now).setExpirationTime(now + 3600)
        .sign(privateKey)
      return Response.json({ access_token: `kto_${'a'.repeat(43)}`, token_type: 'Bearer', expires_in: 3600, scope: 'openid profile permissions', id_token: id })
    }
    if (url === `${ISS}/oauth/identity`) return Response.json({ identity: {} })
    if (url === `${ISS}/oauth/identity/picture`) return Response.json({ ok: true }, { status: 201 })
    return new Response('not found', { status: 404 })
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

const cookieOf = (res: Response, name: string) => {
  const line = res.headers.getSetCookie().find((c) => c.startsWith(`${name}=`))
  return line ? line.slice(name.length + 1).split(';')[0] : undefined
}

async function startLogin() {
  const { GET } = await import('../src/app/login/route')
  const res = await GET(new NextRequest(`${SITE}/login`))
  expect(res.status).toBe(303)
  const to = new URL(res.headers.get('location')!)
  lastNonce = to.searchParams.get('nonce')!
  return { res, to, login: cookieOf(res, '__Host-as.login')! }
}

async function callback(query: string, loginCookie?: string) {
  const { GET } = await import('../src/app/auth/callback/route')
  const headers: Record<string, string> = loginCookie ? { cookie: `__Host-as.login=${loginCookie}` } : {}
  return GET(new NextRequest(`${SITE}/auth/callback?${query}`, { headers }))
}

describe('sign-in routes', () => {
  it('/login redirects to KT with a sealed, HttpOnly, Secure, Lax login cookie', async () => {
    const { res, to } = await startLogin()
    expect(to.origin + to.pathname).toBe(`${ISS}/oauth/authorize`)
    expect(to.searchParams.get('redirect_uri')).toBe(`${SITE}/auth/callback`)
    const set = res.headers.getSetCookie().find((c) => c.startsWith('__Host-as.login='))!
    expect(set).toMatch(/HttpOnly/i)
    expect(set).toMatch(/Secure/i)
    expect(set).toMatch(/SameSite=lax/i)
    expect(set).toMatch(/Path=\//)
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  it('the owner gets a session, and aiden.social identity is reported to KT', async () => {
    const { to, login } = await startLogin()
    const res = await callback(`code=ktx_${'c'.repeat(43)}&state=${to.searchParams.get('state')}&iss=${encodeURIComponent(ISS)}`, login)
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(`${SITE}/`)
    const session = res.headers.getSetCookie().find((c) => c.startsWith('__Host-as.session='))!
    expect(session).toMatch(/HttpOnly/i)
    expect(session).toMatch(/Max-Age=604800/)
    expect(session).not.toContain('kto_')
    expect(cookieOf(res, '__Host-as.owner')).toBe('1')
    // Public client: no secret, client_id and the PKCE verifier in the form.
    const token = calls.find((c) => c.url === `${ISS}/oauth/token`)!
    expect((token.init!.headers as Record<string, string>).authorization).toBeUndefined()
    const form = new URLSearchParams(String(token.init!.body))
    expect(form.get('client_id')).toBe(env.KT_CLIENT_ID)
    expect(form.get('code_verifier')).toMatch(/^[A-Za-z0-9_-]{43}$/)
    const identity = calls.find((c) => c.url === `${ISS}/oauth/identity`)!
    expect(JSON.parse(String(identity.init!.body))).toEqual({ displayName: 'Aiden Tabrizi', handle: 'aidenkt', profileUrl: 'https://aiden.social/' })
    expect(calls.some((c) => c.url === `${ISS}/oauth/identity/picture` && c.init?.method === 'PUT')).toBe(true)

    // The session is readable by /auth/session, and Log Out needs its CSRF token.
    const sessionCookie = cookieOf(res, '__Host-as.session')!
    const { GET: sessionGET } = await import('../src/app/auth/session/route')
    const s = await sessionGET(new NextRequest(`${SITE}/auth/session`, { headers: { cookie: `__Host-as.session=${sessionCookie}`, 'sec-fetch-site': 'same-origin' } }))
    expect(s.status).toBe(200)
    const body = await s.json()
    expect(body.profile).toEqual({ displayName: 'Aiden Tabrizi', handle: 'aidenkt', picture: '/favicon.png', fallbackPicture: `${ISS}/media/p.webp` })

    const { POST } = await import('../src/app/auth/logout/route')
    const noToken = await POST(new NextRequest(`${SITE}/auth/logout`, { method: 'POST', headers: { cookie: `__Host-as.session=${sessionCookie}`, origin: SITE } }))
    expect(noToken.status).toBe(403)
    const crossSite = await POST(new NextRequest(`${SITE}/auth/logout`, { method: 'POST', headers: { cookie: `__Host-as.session=${sessionCookie}`, origin: 'https://evil.test', 'x-csrf-token': body.csrf } }))
    expect(crossSite.status).toBe(403)
    const ok = await POST(new NextRequest(`${SITE}/auth/logout`, { method: 'POST', headers: { cookie: `__Host-as.session=${sessionCookie}`, origin: SITE, 'x-csrf-token': body.csrf, 'sec-fetch-site': 'same-origin' } }))
    expect(ok.status).toBe(200)
    expect(cookieOf(ok, '__Host-as.session')).toBe('')
  })

  it('anyone who is not the owner is refused, with no session and no identity report', async () => {
    owner = false
    const { to, login } = await startLogin()
    const res = await callback(`code=ktx_${'c'.repeat(43)}&state=${to.searchParams.get('state')}&iss=${encodeURIComponent(ISS)}`, login)
    expect(res.status).toBe(403)
    expect(await res.text()).toContain('Please sign in with Aiden’s KT Account.</p>')
    expect(cookieOf(res, '__Host-as.session')).toBeUndefined()
    expect(calls.some((c) => c.url.includes('/oauth/identity'))).toBe(false)
    expect(res.headers.get('content-security-policy')).toMatch(/default-src 'none'; style-src 'sha256-/)
  })

  it('refuses a callback without the login cookie, with a wrong state, or an error', async () => {
    const { to, login } = await startLogin()
    const state = to.searchParams.get('state')!
    expect((await callback(`code=ktx_${'c'.repeat(43)}&state=${state}`)).status).toBe(400)
    expect((await callback(`code=ktx_${'c'.repeat(43)}&state=${'x'.repeat(43)}`, login)).status).toBe(400)
    expect((await callback(`error=access_denied&state=${state}`, login)).status).toBe(400)
    expect(calls.some((c) => c.url === `${ISS}/oauth/token`)).toBe(false)
  })

  it('a confidential client (KT_CLIENT_SECRET set) authenticates with HTTP Basic', async () => {
    vi.stubEnv('KT_CLIENT_SECRET', 'secret')
    const { to, login } = await startLogin()
    const res = await callback(`code=ktx_${'c'.repeat(43)}&state=${to.searchParams.get('state')}&iss=${encodeURIComponent(ISS)}`, login)
    expect(res.status).toBe(303)
    const token = calls.find((c) => c.url === `${ISS}/oauth/token`)!
    expect((token.init!.headers as Record<string, string>).authorization).toMatch(/^Basic /)
    expect(new URLSearchParams(String(token.init!.body)).has('client_id')).toBe(false)
  })

  it('/auth/session without a session answers 401 and clears the hint', async () => {
    const { GET } = await import('../src/app/auth/session/route')
    const res = await GET(new NextRequest(`${SITE}/auth/session`, { headers: { cookie: '__Host-as.owner=1' } }))
    expect(res.status).toBe(401)
    expect(cookieOf(res, '__Host-as.owner')).toBe('')
  })

  it('is unavailable (503) when not configured', async () => {
    vi.stubEnv('SESSION_SECRET', 'short')
    const { GET } = await import('../src/app/login/route')
    const res = await GET(new NextRequest(`${SITE}/login`))
    expect(res.status).toBe(503)
  })
})
