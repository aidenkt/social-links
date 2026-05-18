import type { SectionId } from './sections'

/** Social link count per section — keep in sync with `SectionPicker` `customComponents`. */
export const SECTION_SOCIAL_COUNTS: Record<SectionId, number> = {
  main: 3,
  text: 3,
  photos: 1,
  videos: 2,
  playlists: 3,
  work: 3,
  contact: 2,
}

/** Glass panel shell + tint shim (defined in `globals.css` — keep both in sync). */
export const GLASS_PANEL_CLASS = 'glass-panel'

export const GLASS_PANEL_SHIM_CLASS = 'glass-panel-shim'

export const GLASS_PANEL_BRAND_TINT_CLASS = 'glass-panel-brand-tint'

/** Use on mobile home glass shell so the section dropdown is not clipped. */
export const GLASS_PANEL_MENU_OVERFLOW_CLASS = 'glass-panel-menu-overflow'

/** Desktop custom nav — opaque white aligned with `glass-panel` (see `globals.css`). */
export const DESKTOP_NAV_CAP_WRAP_CLASS = 'desktop-nav-cap-wrap'

export const DESKTOP_NAV_CAP_SHELL_CLASS = 'desktop-nav-cap-shell'

export const DESKTOP_NAV_CAP_CLASS = 'desktop-nav-cap'

export const DESKTOP_NAV_CAP_STROKE_CLASS = 'desktop-nav-cap-stroke'

export const DESKTOP_NAV_BRIDGE_CLASS = 'desktop-nav-bridge'

export const DESKTOP_NAV_TABS_CLASS = 'desktop-nav-tabs'

/** Mobile section dropdown (see `globals.css`). */
export const SECTION_MENU_TRIGGER_CLASS = 'section-menu-trigger'

export const SECTION_MENU_PANEL_CLASS = 'section-menu-panel'

export function getSectionMenuItemClassName(active: boolean): string {
  return `section-menu-item${active ? ' section-menu-item-active' : ''}`
}

/** Desktop tab pill sizing — shared by live tabs and skeleton (border always reserved). */
export function getDesktopNavTabClassName(active: boolean, interactive = false): string {
  const state = active
    ? 'border-neutral-200/80 bg-white text-black shadow-sm'
    : 'border-transparent text-neutral-600 shadow-none'

  const base = `box-border shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-xs font-medium md:px-4 md:text-sm ${state}`

  if (!interactive) return base

  const interactiveAffordance = active
    ? 'cursor-pointer hover:bg-white hover:shadow-md'
    : 'cursor-pointer hover:border-neutral-200/80 hover:bg-neutral-100 hover:text-neutral-900 hover:shadow-sm'

  return `${base} transition-[color,background-color,box-shadow,border-color] duration-200 ${interactiveAffordance} focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/35 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50`
}

/**
 * Fixed 3-row slot — 3× card (~74px: 50px row + p-3) + 2× gap-2 (8px).
 * Same height on every section; only alignment changes inside.
 */
export const SOCIAL_LIST_LAYOUT_BASE = 'flex w-full h-[15rem] shrink-0 flex-col'

/** Outer slot — fixed height; justify is applied on the keyed inner layer during transitions. */
export const SOCIAL_LIST_SLOT_CLASS = `${SOCIAL_LIST_LAYOUT_BASE} relative`

/** Top-align when fewer than 3 links; vertically center when full (inner animated layer only). */
export function getSocialListInnerLayoutClass(sectionId: SectionId): string {
  const justify = SECTION_SOCIAL_COUNTS[sectionId] >= 3 ? 'justify-center' : 'justify-start'
  return `relative z-10 flex h-full w-full flex-col ${justify}`
}

/** Desktop home-page social list glass shell. */
export function getSocialPanelShellClass(_sectionId?: SectionId): string {
  return `${GLASS_PANEL_CLASS} p-2 md:px-3`
}

export const SOCIAL_LIST_CLASS = 'grid grid-cols-1 gap-2'
