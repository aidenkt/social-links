import type { NextRequest } from 'next/server'
import { readAuthConfig } from '../../../lib/auth/config'
import { json } from '../../../lib/auth/http'
import { endSession, readSession } from '../../../lib/auth/session'
import { OWNER_PROFILE } from '../../../lib/owner-profile'

export const dynamic = 'force-dynamic'

/**
 * GET /auth/session: what the owner corner draws, plus the CSRF token Log Out needs.
 * Same-origin only (a JSON body other sites cannot read). No session: 401, and the hint
 * cookie is cleared so the page stops asking.
 */
export async function GET(req: NextRequest) {
  const site = req.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin') return json({ signedIn: false }, 403)
  const config = readAuthConfig()
  const session = config ? await readSession(req, config.sessionSecret) : null
  if (!session) {
    const res = json({ signedIn: false }, 401)
    endSession(res)
    return res
  }
  return json({
    signedIn: true,
    profile: {
      displayName: OWNER_PROFILE.displayName,
      handle: OWNER_PROFILE.handle,
      picture: OWNER_PROFILE.picture,
      fallbackPicture: session.ktPicture,
    },
    csrf: session.csrf,
  })
}
