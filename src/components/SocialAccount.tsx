'use client'

import Image from 'next/image'
import { isMovingToSiblingSocialRow, setGlassPanelBrandTint } from '../lib/glass-brand-tint'
import TrackedOutboundLink from './TrackedOutboundLink'

interface UserFollowCardProps {
  src: string
  name: string
  platform: string
  cta: string
  link: string
  buttonColor?: string
  textColor?: string
}

export default function SocialAccount({
  src,
  name,
  platform,
  cta,
  link,
  buttonColor,
  textColor = 'white',
}: UserFollowCardProps) {
  const brandColor = buttonColor ?? '#3B82F6'

  const activateTint = (row: HTMLElement) => setGlassPanelBrandTint(row, brandColor, true)
  const deactivateTint = (row: HTMLElement) => setGlassPanelBrandTint(row, brandColor, false)

  return (
    <div
      className="social-row relative"
      onMouseEnter={(event) => activateTint(event.currentTarget)}
      onMouseLeave={(event) => {
        if (isMovingToSiblingSocialRow(event.currentTarget, event.relatedTarget)) return
        deactivateTint(event.currentTarget)
      }}
      onFocusCapture={(event) => activateTint(event.currentTarget)}
      onBlurCapture={(event) => deactivateTint(event.currentTarget)}
      onTouchStart={(event) => activateTint(event.currentTarget)}
      onTouchEnd={(event) => deactivateTint(event.currentTarget)}
      onTouchCancel={(event) => deactivateTint(event.currentTarget)}
    >
      <div
        className="relative z-10 flex items-center gap-3 rounded-lg border border-neutral-200/70 bg-white p-3 shadow-sm transition-[border-color,box-shadow,transform] duration-280 ease-out [-webkit-tap-highlight-color:transparent] hover:border-white/90 hover:shadow-md focus-within:border-white/90 focus-within:shadow-md active:scale-[0.99] md:active:scale-100"
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
      >
        <TrackedOutboundLink
          href={link}
          target="_blank"
          rel={link.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
          analyticsLabel={cta}
          analyticsSource={`social-card:${platform}`}
          aria-label={`${cta}, ${name} on ${platform}`}
          className="absolute inset-0 z-20 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 md:hidden"
        />
        <div className="flex-shrink-0 select-none">
          <Image
            className="pointer-events-none rounded-[22%] object-cover shadow-sm ring-1 ring-black/[0.06] select-none"
            src={src}
            alt=""
            width={50}
            height={50}
            unoptimized
            draggable={false}
          />
        </div>

        <div className="flex min-w-0 flex-col">
          <span className="truncate text-base font-bold">{name}</span>
          <span className="truncate text-sm text-neutral-500">{platform}</span>
        </div>

        <div className="flex-grow" />

        <span
          aria-hidden
          className="relative z-10 inline-flex h-9 min-w-[5.75rem] shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium tabular-nums md:hidden"
          style={{
            backgroundColor: brandColor,
            color: textColor,
          }}
        >
          {cta}
        </span>
        <TrackedOutboundLink
          href={link}
          className="relative z-10 hidden h-9 min-w-[5.75rem] shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium tabular-nums transition-all hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 md:inline-flex"
          target="_blank"
          rel={link.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
          analyticsLabel={cta}
          analyticsSource={`social-card:${platform}`}
          style={{
            backgroundColor: brandColor,
            color: textColor,
          }}
        >
          {cta}
        </TrackedOutboundLink>
      </div>
    </div>
  )
}
