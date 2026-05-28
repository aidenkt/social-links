import type { ReactNode } from 'react'
import {
  DESKTOP_NAV_BRIDGE_CLASS,
  DESKTOP_NAV_CAP_CLASS,
  DESKTOP_NAV_CAP_SHELL_CLASS,
  DESKTOP_NAV_CAP_STROKE_CLASS,
  DESKTOP_NAV_CAP_WRAP_CLASS,
  DESKTOP_NAV_TABS_CLASS,
  GLASS_PANEL_BRAND_TINT_CLASS,
  GLASS_PANEL_PADDING_CLASS,
  GLASS_PANEL_SHIM_CLASS,
  SOCIAL_LIST_CLASS,
  getDesktopNavTabClassName,
  getSocialListInnerLayoutClass,
  getSocialPanelShellClass,
  SOCIAL_LIST_SLOT_CLASS,
  SECTION_MENU_TRIGGER_CLASS,
} from '../lib/social-panel'
import GlassPanel from './GlassPanel'
import type { SectionId } from '../lib/sections'

type SectionSummary = { id: string; label: string }

type SectionPickerSkeletonProps = {
  headlineFontClassName: string
  headlineLines: ReactNode
  showSectionControls: boolean
  activeSectionId: SectionId
  sectionSummaries: SectionSummary[]
}

function SocialAccountRowSkeleton() {
  return (
    <div
      className="relative flex items-center gap-3 rounded-lg border border-neutral-200/70 bg-white p-3 shadow-sm"
      aria-hidden
    >
      <div className="flex-shrink-0">
        <div className="h-[50px] w-[50px] animate-pulse rounded-[22%] bg-neutral-200 shadow-sm ring-1 ring-black/[0.06]" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="h-4 w-[80%] max-w-[12.5rem] animate-pulse rounded-sm bg-neutral-200/90" />
        <div className="h-3.5 w-[52%] max-w-[7.5rem] animate-pulse rounded-sm bg-neutral-200/75" />
      </div>
      <div className="min-w-0 flex-grow" />
      <div className="h-9 min-w-[5.75rem] shrink-0 animate-pulse rounded-full bg-neutral-200" />
    </div>
  )
}

function SocialListSkeleton() {
  return (
    <div className={SOCIAL_LIST_CLASS}>
      <SocialAccountRowSkeleton />
      <SocialAccountRowSkeleton />
      <SocialAccountRowSkeleton />
    </div>
  )
}

export default function SectionPickerSkeleton({
  headlineFontClassName,
  headlineLines,
  showSectionControls,
  activeSectionId,
  sectionSummaries,
}: SectionPickerSkeletonProps) {
  const headlineEl = (
    <p
      className={`${headlineFontClassName} w-full text-center text-2xl font-semibold text-neutral-900 md:text-[1.3rem]`}
    >
      {headlineLines}
    </p>
  )

  if (!showSectionControls) {
    return (
      <div
        className="flex w-full min-w-0 shrink-0 flex-col gap-3 px-0 py-1 md:gap-3"
        aria-busy="true"
      >
        <GlassPanel className={GLASS_PANEL_PADDING_CLASS}>
          <div className="-mt-1 px-2 py-1 md:-mt-1.5 md:py-1.5">{headlineEl}</div>
          <div className={SOCIAL_LIST_SLOT_CLASS}>
            <div className={getSocialListInnerLayoutClass(activeSectionId)}>
              <SocialListSkeleton />
            </div>
          </div>
        </GlassPanel>
      </div>
    )
  }

  const mobileGlass = (
    <GlassPanel
      className={`gap-3 ${GLASS_PANEL_PADDING_CLASS} md:hidden`}
      contentClassName="flex min-h-0 flex-col gap-3"
    >
      <div className="flex flex-col gap-3">
        <div className="px-1 text-center">{headlineEl}</div>
        <div
          className={`pointer-events-none ${SECTION_MENU_TRIGGER_CLASS}`}
          aria-hidden
        >
          <div className="h-5 w-[40%] max-w-[12rem] animate-pulse rounded bg-neutral-200/90" />
          <div className="section-menu-trigger-chevron animate-pulse bg-neutral-200/90 ring-neutral-200/90" />
        </div>
      </div>
      <div className={SOCIAL_LIST_SLOT_CLASS}>
        <div className={getSocialListInnerLayoutClass(activeSectionId)}>
          <SocialListSkeleton />
        </div>
      </div>
    </GlassPanel>
  )

  return (
    <div
      className="flex w-full min-w-0 shrink-0 flex-col gap-3 px-0 py-1 md:gap-3"
      aria-busy="true"
    >
      {mobileGlass}
      <div className="relative left-1/2 mb-3 hidden w-[100dvw] max-w-[100dvw] -translate-x-1/2 px-4 md:mb-3 md:block">
        <div className="relative mx-auto flex w-fit max-w-full flex-col items-center px-6 pt-3 pb-3 text-center">
          <div className={`pointer-events-none absolute inset-x-0 top-2 ${DESKTOP_NAV_CAP_WRAP_CLASS}`} aria-hidden>
            <div className={DESKTOP_NAV_CAP_SHELL_CLASS}>
              <div className={DESKTOP_NAV_CAP_CLASS} />
            </div>
            <div className={DESKTOP_NAV_CAP_STROKE_CLASS} />
          </div>
          <div className="relative z-10 px-10 pt-1 pb-2">{headlineEl}</div>
          <div className="relative mx-auto w-max max-w-full">
            <div
              className={`pointer-events-none absolute left-1/2 z-[11] h-[7px] -translate-x-1/2 rounded-none ${DESKTOP_NAV_BRIDGE_CLASS}`}
              style={{ top: '-5px' }}
              aria-hidden
            />
            <div
              className={`relative z-10 ${DESKTOP_NAV_TABS_CLASS}`}
              role="presentation"
            >
              {sectionSummaries.map((section) => {
                const active = section.id === activeSectionId
                return (
                  <div
                    key={section.id}
                    className={getDesktopNavTabClassName(active)}
                    aria-hidden
                  >
                    <span className="select-none text-transparent">{section.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className={`${getSocialPanelShellClass(activeSectionId)} hidden md:flex`}>
        <div aria-hidden className={GLASS_PANEL_SHIM_CLASS} />
        <div aria-hidden className={GLASS_PANEL_BRAND_TINT_CLASS} />
        <div className={SOCIAL_LIST_SLOT_CLASS}>
          <div className={getSocialListInnerLayoutClass(activeSectionId)}>
            <SocialListSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}
