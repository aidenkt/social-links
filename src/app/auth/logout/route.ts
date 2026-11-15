import type { NextRequest } from 'next/server'
import { readAuthConfig } from '../../../lib/auth/config'
import { json } from '../../../lib/auth/http'
import { safeEqual } from '../../../lib/auth/seal'
import { endSession, readSession } from '../../../lib/auth/session'

export const dynamic = 'force-dynamic'

/**
 * POST /auth/logout: ends the session. CSRF: the request must come from this origin
 * (Origin header, and Sec-Fetch-Site when the browser sends it) and carry the session's
 * CSRF token in X-CSRF-Token. The cookie is SameSite=Lax as well.
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  const site = req.headers.get('sec-fetch-site')
  if (!origin || origin !== req.nextUrl.origin || (site && site !== 'same-origin')) return json({ error: 'forbidden' }, 403)
  const config = readAuthConfig()
  const session = config ? await readSession(req, config.sessionSecret) : null
  const token = req.headers.get('x-csrf-token') ?? ''
  if (session && !safeEqual(token, session.csrf)) return json({ error: 'forbidden' }, 403)
  const res = json({ ok: true })
  endSession(res)
  return res
}

export function GET() {
  return json({ error: 'method_not_allowed' }, 405)
}
