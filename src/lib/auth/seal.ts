import { EncryptJWT, jwtDecrypt, base64url } from 'jose'

/**
 * Sealed cookies: a JWE (dir + A256GCM), so the content is both encrypted and
 * tamper-proof. The 256-bit key is derived with HKDF-SHA-256 from SESSION_SECRET, with a
 * different `info` per cookie purpose, so a login cookie can never be replayed as a
 * session cookie (and the other way round).
 */
const enc = new TextEncoder()

export type SealPurpose = 'login' | 'session'

const keyCache = new Map<string, Promise<Uint8Array>>()

function keyFor(secret: string, purpose: SealPurpose): Promise<Uint8Array> {
  const id = `${purpose}\u0000${secret}`
  let k = keyCache.get(id)
  if (!k) {
    k = (async () => {
      const base = await crypto.subtle.importKey('raw', enc.encode(secret), 'HKDF', false, ['deriveBits'])
      const bits = await crypto.subtle.deriveBits(
        { name: 'HKDF', hash: 'SHA-256', salt: enc.encode('aiden.social'), info: enc.encode(`kt-${purpose}-v1`) },
        base,
        256
      )
      return new Uint8Array(bits)
    })()
    keyCache.set(id, k)
  }
  return k
}

export async function seal(
  secret: string,
  purpose: SealPurpose,
  claims: Record<string, unknown>,
  ttlSeconds: number,
  now = Date.now()
): Promise<string> {
  const iat = Math.floor(now / 1000)
  return new EncryptJWT(claims)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM', typ: purpose })
    .setIssuedAt(iat)
    .setExpirationTime(iat + ttlSeconds)
    .encrypt(await keyFor(secret, purpose))
}

export async function unseal(
  secret: string,
  purpose: SealPurpose,
  token: string | undefined | null,
  now = Date.now()
): Promise<Record<string, unknown> | null> {
  if (!token || token.length > 4096) return null
  try {
    const { payload, protectedHeader } = await jwtDecrypt(token, await keyFor(secret, purpose), {
      keyManagementAlgorithms: ['dir'],
      contentEncryptionAlgorithms: ['A256GCM'],
      currentDate: new Date(now),
    })
    if (protectedHeader.typ !== purpose) return null
    return payload as Record<string, unknown>
  } catch {
    return null
  }
}

export function randomToken(bytes = 32): string {
  return base64url.encode(crypto.getRandomValues(new Uint8Array(bytes)))
}

export async function pkceChallenge(verifier: string): Promise<string> {
  return base64url.encode(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(verifier))))
}

/** Constant-time comparison of two strings. */
export function safeEqual(a: string, b: string): boolean {
  const x = enc.encode(a)
  const y = enc.encode(b)
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return diff === 0
}
