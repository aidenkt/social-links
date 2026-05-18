import type { ReactNode } from 'react'
import {
  GLASS_PANEL_BRAND_TINT_CLASS,
  GLASS_PANEL_CLASS,
  GLASS_PANEL_SHIM_CLASS,
} from '../lib/social-panel'

type GlassPanelProps = {
  className?: string
  contentClassName?: string
  children: ReactNode
}

export default function GlassPanel({ className = '', contentClassName = '', children }: GlassPanelProps) {
  return (
    <div className={`${GLASS_PANEL_CLASS} ${className}`.trim()}>
      <div aria-hidden className={GLASS_PANEL_SHIM_CLASS} />
      <div aria-hidden className={GLASS_PANEL_BRAND_TINT_CLASS} />
      <div className={`relative z-10 ${contentClassName}`.trim()}>{children}</div>
    </div>
  )
}
