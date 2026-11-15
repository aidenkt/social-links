'use client'

import { useEffect, useRef, useState } from 'react'
import pin from '../lib/kt-kit-pin.json'

/**
 * The owner's corner, drawn by the KT Accounts kit in supplied-session mode: this site signs
 * Aiden in itself (/login) and hands the kit the person to draw. Visitors get nothing: the
 * kit is loaded only after /auth/session confirms the owner, and that is asked only when
 * the page-readable hint cookie is present.
 */

const HINT_COOKIE = '__Host-as.owner'

interface Profile {
  displayName: string
  handle: string
  picture: string
  fallbackPicture: string | null
}

interface MenuItem {
  label: string
  icon?: string
  toggle?: boolean
  checked?: boolean
  onChange?: (checked: boolean) => void
}

interface Kit {
  supply?: (
    person: { displayName: string; handle?: string | null; avatarUrl: string; bannerUrl?: string | null; profileUrl?: string | null } | null,
    opts?: { onLogOut?: () => void | Promise<void> }
  ) => void
  menuItems?: (items: MenuItem[]) => void
  close?: () => void
}

const kit = () => (window as unknown as { ktAccounts?: Kit }).ktAccounts

function hasHint(): boolean {
  try {
    return document.cookie.split(/;\s*/).some((c) => c === `${HINT_COOKIE}=1`)
  } catch {
    return false
  }
}

/** The aiden.social picture, or the KT picture when it does not load. */
function pictureThatLoads(p: Profile): Promise<string> {
  return new Promise((resolve) => {
    if (!p.fallbackPicture) return resolve(p.picture)
    const img = new Image()
    img.onload = () => resolve(p.picture)
    img.onerror = () => resolve(p.fallbackPicture!)
    img.src = p.picture
  })
}

function loadKit(): Promise<Kit | null> {
  if (kit()) return Promise.resolve(kit()!)
  return new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = `${pin.origin}/kit/${pin.js.file}`
    s.integrity = pin.js.integrity
    s.crossOrigin = 'anonymous'
    s.async = true
    s.onload = () => resolve(kit() ?? null)
    s.onerror = () => resolve(null)
    document.head.appendChild(s)
  })
}

export default function OwnerCorner() {
  const [owner, setOwner] = useState<{ profile: Profile; csrf: string } | null>(null)
  const [preview, setPreview] = useState(false)
  const setPreviewRef = useRef(setPreview)

  useEffect(() => {
    if (!hasHint()) return
    const ctl = new AbortController()
    fetch('/auth/session', { credentials: 'same-origin', cache: 'no-store', signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: unknown) => {
        const b = body as { signedIn?: unknown; profile?: Profile; csrf?: unknown } | null
        if (b && b.signedIn === true && b.profile && typeof b.csrf === 'string') setOwner({ profile: b.profile, csrf: b.csrf })
      })
      .catch(() => {})
    return () => ctl.abort()
  }, [])

  // Once the host element is in the page: load the pinned kit and hand it the owner.
  useEffect(() => {
    if (!owner) return
    let cancelled = false
    void (async () => {
      const [k, avatarUrl] = await Promise.all([loadKit(), pictureThatLoads(owner.profile)])
      if (cancelled || !k?.supply || !k.menuItems) return
      k.menuItems([
        { label: 'Preview Mode', icon: 'eye', toggle: true, checked: false, onChange: (on) => setPreviewRef.current(on) },
      ])
      k.supply(
        {
          displayName: owner.profile.displayName,
          handle: owner.profile.handle,
          avatarUrl,
          bannerUrl: '/owner-banner.svg',
          profileUrl: '/',
        },
        {
          onLogOut: async () => {
            try {
              await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin', headers: { 'x-csrf-token': owner.csrf } })
            } catch {
              /* the reload shows whatever the server decided */
            }
            window.location.reload()
          },
        }
      )
    })()
    return () => {
      cancelled = true
    }
  }, [owner])

  // Preview Mode: the corner is hidden; Escape brings it back.
  useEffect(() => {
    const k = kit()
    if (preview) {
      k?.close?.()
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setPreview(false)
      }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
    k?.menuItems?.([
      { label: 'Preview Mode', icon: 'eye', toggle: true, checked: false, onChange: (on) => setPreviewRef.current(on) },
    ])
  }, [preview])

  if (!owner) return null
  return (
    <div
      data-kt-account=""
      data-kt-fixed=""
      data-kt-session="supplied"
      data-variant="glass"
      data-card="glass"
      data-owner-corner=""
      style={preview ? { display: 'none' } : undefined}
    />
  )
}
