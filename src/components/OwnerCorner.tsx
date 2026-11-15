'use client'

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'

/**
 * The owner's corner: when Aiden is signed in (Sign in with KT Account, see /login), his
 * aiden.social picture sits in the top-right corner and opens a card shaped like the KT
 * Accounts kit's account menu (banner, picture, name, handle, then the actions).
 *
 * Visitors get nothing: the component only asks the server (/auth/session) when the
 * page-readable hint cookie is present, and renders nothing otherwise. The hint grants
 * nothing; the session itself is an HttpOnly cookie checked on the server.
 *
 * Preview Mode hides the corner so the page looks exactly as visitors see it. It lasts
 * until Escape is pressed or the page is reloaded.
 */

const HINT_COOKIE = '__Host-as.owner'
const SETTINGS_URL = 'https://accounts.aidenkt.com/settings'

interface Profile {
  displayName: string
  handle: string
  picture: string
  fallbackPicture: string | null
}

type State = { kind: 'none' } | { kind: 'owner'; profile: Profile; csrf: string }

function hasHint(): boolean {
  try {
    return document.cookie.split(/;\s*/).some((c) => c === `${HINT_COOKIE}=1`)
  } catch {
    return false
  }
}

function Icon({ paths }: { paths: string[] }) {
  return (
    <svg className="oc-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

// The KT Accounts kit's own line icons (KT_STROKES), plus an eye drawn the same way.
const EYE = ['M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z', 'M12 14.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z']
const SETTINGS = ['M4 7h10M18 7h2M4 17h4M12 17h8', 'M16 9.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5ZM10 19.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z']
const SIGN_OUT = ['M14.5 4.5h4v15h-4', 'M10 8l-4 4 4 4M6 12h9']

function Avatar({ profile, size }: { profile: Profile; size: 'sm' | 'lg' }) {
  const [src, setSrc] = useState(profile.picture)
  const px = size === 'sm' ? 40 : 64
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`oc-av oc-av-${size}`}
      src={src}
      alt=""
      width={px}
      height={px}
      decoding="async"
      draggable={false}
      onError={() => {
        if (profile.fallbackPicture && src !== profile.fallbackPicture) setSrc(profile.fallbackPicture)
      }}
    />
  )
}

export default function OwnerCorner() {
  const [state, setState] = useState<State>({ kind: 'none' })
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!hasHint()) return
    const ctl = new AbortController()
    fetch('/auth/session', { credentials: 'same-origin', cache: 'no-store', signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: unknown) => {
        const b = body as { signedIn?: unknown; profile?: Profile; csrf?: unknown } | null
        if (b && b.signedIn === true && b.profile && typeof b.csrf === 'string') {
          setState({ kind: 'owner', profile: b.profile, csrf: b.csrf })
        }
      })
      .catch(() => {})
    return () => ctl.abort()
  }, [])

  const items = useCallback(
    () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? []),
    []
  )

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false)
    if (returnFocus) buttonRef.current?.focus()
  }, [])

  // Focus the first item on open; close on a click outside.
  useEffect(() => {
    if (!open) return
    items()[0]?.focus()
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !buttonRef.current?.contains(t)) close(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open, items, close])

  // Escape leaves Preview Mode.
  useEffect(() => {
    if (!preview) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [preview])

  const onMenuKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const list = items()
    const i = list.indexOf(document.activeElement as HTMLElement)
    const go = (n: number) => {
      e.preventDefault()
      list[(n + list.length) % list.length]?.focus()
    }
    if (e.key === 'ArrowDown') go(i + 1)
    else if (e.key === 'ArrowUp') go(i - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(list.length - 1)
    else if (e.key === 'Escape') {
      e.preventDefault()
      close(true)
    } else if (e.key === 'Tab') close(false)
  }

  if (state.kind !== 'owner' || preview) return null
  const { profile, csrf } = state

  const logOut = async () => {
    if (busy) return
    setBusy(true)
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'x-csrf-token': csrf },
      })
    } catch {
      /* the reload below shows whatever the server decided */
    }
    window.location.reload()
  }

  return (
    <div className="owner-corner" data-owner-corner="">
      <button
        ref={buttonRef}
        type="button"
        className="oc-me"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Account menu for ${profile.displayName}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar profile={profile} size="sm" />
      </button>
      {open ? (
        <div ref={menuRef} id={menuId} className="oc-menu" role="menu" aria-label="Account" onKeyDown={onMenuKey}>
          <div className="oc-who">
            <span className="oc-banner" aria-hidden="true" />
            <span className="oc-body">
              <span className="oc-av-ring">
                <Avatar profile={profile} size="lg" />
              </span>
              <span className="oc-text">
                <b className="oc-name">{profile.displayName}</b>
                <span className="oc-handle">@{profile.handle}</span>
              </span>
            </span>
          </div>
          <div className="oc-acts">
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={preview}
              className="oc-item"
              tabIndex={-1}
              onClick={() => {
                setOpen(false)
                setPreview(true)
              }}
            >
              <Icon paths={EYE} />
              <span className="oc-label">Preview Mode</span>
              <span className="oc-switch" aria-hidden="true" />
            </button>
            <a role="menuitem" className="oc-item" href={SETTINGS_URL} tabIndex={-1}>
              <Icon paths={SETTINGS} />
              <span className="oc-label">Account Settings</span>
            </a>
            <button type="button" role="menuitem" className="oc-item" tabIndex={-1} onClick={logOut} disabled={busy}>
              <Icon paths={SIGN_OUT} />
              <span className="oc-label">Log Out</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
