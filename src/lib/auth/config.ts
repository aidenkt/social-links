import 'server-only'

/**
 * Server-only settings for "Sign in with KT Account". Read from the environment on each
 * request so a missing value fails that request closed instead of the build.
 *
 *   KT_CLIENT_ID        the app's client ID from the KT Developer Portal
 *   KT_CLIENT_SECRET    its client secret (confidential client)
 *   SESSION_SECRET      at least 32 characters; seals the login and session cookies
 *   KT_ACCOUNTS_ORIGIN  optional, default https://accounts.aidenkt.com (local mocks only)
 *   KT_REDIRECT_URI     optional, default <this site's origin>/auth/callback
 */
export interface AuthConfig {
  issuer: string
  clientId: string
  clientSecret: string
  sessionSecret: string
  redirectUriOverride: string | null
}

export const DEFAULT_KT_ORIGIN = 'https://accounts.aidenkt.com'

export function readAuthConfig(env: Record<string, string | undefined> = process.env): AuthConfig | null {
  const clientId = env.KT_CLIENT_ID?.trim() ?? ''
  const clientSecret = env.KT_CLIENT_SECRET?.trim() ?? ''
  const sessionSecret = env.SESSION_SECRET ?? ''
  if (!clientId || clientId.length > 80 || !clientSecret || sessionSecret.length < 32) return null
  const issuer = originOf(env.KT_ACCOUNTS_ORIGIN?.trim() || DEFAULT_KT_ORIGIN)
  if (!issuer) return null
  const redirect = env.KT_REDIRECT_URI?.trim()
  let redirectUriOverride: string | null = null
  if (redirect) {
    try {
      const u = new URL(redirect)
      if (u.protocol !== 'https:' && !isLocal(u)) return null
      redirectUriOverride = u.href
    } catch {
      return null
    }
  }
  return { issuer, clientId, clientSecret, sessionSecret, redirectUriOverride }
}

function isLocal(u: URL) {
  return u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')
}

/** An https origin (http only for localhost), without a trailing slash. */
function originOf(raw: string): string | null {
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:' && !isLocal(u)) return null
    if (u.pathname !== '/' || u.search || u.hash || u.username || u.password) return null
    return u.origin
  } catch {
    return null
  }
}
