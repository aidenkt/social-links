'use client'

import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import posthog from 'posthog-js'

type TrackedOutboundLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  analyticsLabel?: string
  analyticsSource?: string
}

function inferDestination(href: string): string {
  if (href.startsWith('mailto:')) return 'email'
  if (href.startsWith('tel:')) return 'phone'
  try {
    const parsed = new URL(href, typeof window !== 'undefined' ? window.location.origin : 'https://example.com')
    return parsed.hostname || 'unknown'
  } catch {
    return 'unknown'
  }
}

export default function TrackedOutboundLink({
  href,
  onClick,
  analyticsLabel,
  analyticsSource,
  children,
  ...rest
}: TrackedOutboundLinkProps) {
  const hrefValue = typeof href === 'string' ? href : ''

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (hrefValue) {
      posthog.capture('outbound_link_clicked', {
        href: hrefValue,
        destination: inferDestination(hrefValue),
        label: analyticsLabel ?? null,
        source: analyticsSource ?? null,
      })
    }
    onClick?.(event)
  }

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}
