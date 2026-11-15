import 'server-only'
import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'

/**
 * Headers for /login and /auth/*: never cached, never framed, never indexed, no referrer
 * (the callback URL carries the code). The CSP is `default-src 'none'`; the one HTML page
 * these routes can render allows exactly its own stylesheet by hash.
 */
export function secure(res: NextResponse, csp = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"): NextResponse {
  res.headers.set('cache-control', 'no-store')
  res.headers.set('content-security-policy', csp)
  res.headers.set('referrer-policy', 'no-referrer')
  res.headers.set('x-content-type-options', 'nosniff')
  res.headers.set('x-frame-options', 'DENY')
  res.headers.set('x-robots-tag', 'noindex, nofollow')
  res.headers.set('cross-origin-opener-policy', 'same-origin')
  res.headers.set('cross-origin-resource-policy', 'same-origin')
  return res
}

export function redirectTo(location: string | URL): NextResponse {
  return secure(new NextResponse(null, { status: 303, headers: { location: String(location) } }))
}

export function json(body: unknown, status = 200): NextResponse {
  return secure(NextResponse.json(body, { status }))
}

/** Every message these routes can show. Errors start with "Please". */
export const MESSAGES = {
  notOwner: 'Please sign in with Aiden’s KT Account.',
  retry: 'Please try again.',
  unavailable: 'Please try again later.',
} as const

const STYLE = `
:root{color-scheme:light}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;background:#fff;color:#171717;
font:400 15px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
background-image:radial-gradient(rgb(23 23 23 / .07) 1px,transparent 1px);background-size:20px 20px}
main{width:min(100%,360px);padding:28px 24px 22px;border-radius:16px;background:rgb(255 255 255 / .85);
border:1px solid rgb(255 255 255 / .55);box-shadow:0 18px 50px -24px rgba(0,0,0,.28),0 0 0 1px rgba(0,0,0,.05);text-align:center}
h1{margin:0 0 8px;font-size:20px;font-weight:600;letter-spacing:-.01em}
p{margin:0;color:#525252}
nav{display:flex;justify-content:center;gap:8px;margin-top:20px}
a{display:inline-flex;align-items:center;min-height:40px;padding:0 16px;border-radius:999px;font-weight:500;font-size:14px;
text-decoration:none;color:#171717;border:1px solid rgb(229 229 229);background:#fff}
a:hover{background:#f5f5f5}
a:focus-visible{outline:2px solid #0a0a0a;outline-offset:2px}
`.trim()
const STYLE_HASH = createHash('sha256').update(STYLE).digest('base64')

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** A small page in aiden.social's look: a title, the message, and where to go next. */
export function messagePage(message: string, opts: { retry: boolean; status?: number }): NextResponse {
  const links = [
    opts.retry ? `<a href="/login">Try Again</a>` : '',
    `<a href="/">Back to aiden.social</a>`,
  ].join('')
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Sign In | aiden.social</title><style>${STYLE}</style></head><body><main><h1>Sign In</h1><p>${escapeHtml(message)}</p><nav>${links}</nav></main></body></html>`
  return secure(
    new NextResponse(html, { status: opts.status ?? 400, headers: { 'content-type': 'text/html; charset=utf-8' } }),
    `default-src 'none'; style-src 'sha256-${STYLE_HASH}'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`
  )
}
