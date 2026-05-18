import type { ReactNode } from 'react'
import { SOCIAL_PANEL_SHELL_CLASS } from '../lib/social-panel'
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
      className="relative flex items-center gap-3 rounded-lg border border-neutral-200/70 bg-white p-3 shadow-sm max-sm:border-0 max-sm:bg-white max-sm:shadow-sm"
      aria-hidden
    >
      <div className="flex-shrink-0">
        <div className="h-[50px] w-[50px] animate-pulse rounded-[22%] bg-neutral-200 shadow-sm ring-1 ring-black/[0.06]" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="h-6 max-w-[min(100%,14rem)] animate-pulse rounded bg-neutral-200/90" />
        <div className="mt-0.5 h-5 max-w-[min(100%,10rem)] animate-pulse rounded bg-neutral-200/75" />
      </div>
      <div className="min-w-0 flex-grow" />
      <div className="h-9 min-w-[5.75rem] shrink-0 animate-pulse rounded-full bg-neutral-200" />
    </div>
  )
}

function SocialListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2">
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
      className={`${headlineFontClassName} w-full text-center text-2xl font-semibold text-neutral-900 sm:text-[1.3rem]`}
    >
      {headlineLines}
    </p>
  )

  if (!showSectionControls) {
    return (
      <div
        className="flex w-full min-w-0 shrink-0 flex-col gap-3 px-0 py-1 sm:gap-4"
        aria-busy="true"
      >
        <div className="relative isolate w-full overflow-hidden rounded-2xl border border-white/55 bg-white/30 p-3 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.04] backdrop-blur-xl [backdrop-filter:saturate(130%)_blur(20px)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0.12)_44%,rgba(255,255,255,0.08)_100%),radial-gradient(130%_65%_at_14%_-12%,rgba(255,120,185,0.12)_0%,rgba(255,120,185,0)_46%),radial-gradient(140%_80%_at_88%_0%,rgba(90,170,255,0.12)_0%,rgba(90,170,255,0)_48%),radial-gradient(160%_95%_at_58%_102%,rgba(255,210,120,0.10)_0%,rgba(255,210,120,0)_52%)]"
          />
          <div className="relative z-10 px-2 py-1 sm:py-2">{headlineEl}</div>
          <div className="relative z-10 mt-2 max-sm:mt-3">
            <SocialListSkeleton />
          </div>
        </div>
      </div>
    )
  }

  const desktopTabs = (
    <div className="relative left-1/2 mb-3 hidden w-[100dvw] max-w-[100dvw] -translate-x-1/2 px-4 sm:mb-4 md:block">
      <div className="relative mx-auto flex w-fit max-w-full flex-col items-center px-6 pt-3 pb-3 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-2 h-20" aria-hidden>
          <div className="absolute left-1/2 top-0 h-20 w-[62%] -translate-x-1/2 rounded-[2rem] border-x border-t border-b-0 border-black/[0.05] bg-[#f7f7f7] shadow-[0_10px_24px_-18px_rgba(0,0,0,0.35)]" />
        </div>
        <div className="relative z-10 px-10 pt-1 pb-2">{headlineEl}</div>
        <div className="relative mx-auto w-max max-w-full">
          <div
            className="pointer-events-none absolute left-1/2 z-[11] h-[7px] w-[66.9%] -translate-x-1/2 rounded-none bg-[#f7f7f7]"
            style={{ top: '-5px' }}
            aria-hidden
          />
          <div
            className="relative z-10 inline-flex w-max max-w-full flex-nowrap gap-0.5 overflow-x-auto rounded-full border border-black/[0.06] bg-[#f7f7f7] px-1 py-1 shadow-[0_12px_28px_-18px_rgba(0,0,0,0.45)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="presentation"
          >
            {sectionSummaries.map((section) => {
              const active = section.id === activeSectionId
              return (
                <div
                  key={section.id}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium sm:px-4 sm:text-sm ${
                    active
                      ? 'border border-neutral-200/80 bg-white text-black shadow-sm'
                      : 'border border-transparent text-neutral-600'
                  }`}
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
  )

  const mobileHeader = (
    <div className="relative z-10 mb-3 flex min-h-[9.5rem] flex-col sm:mb-4 md:hidden">
      <div className="min-h-0 flex-1" aria-hidden />
      <div className="shrink-0 px-2">{headlineEl}</div>
      <div className="min-h-0 flex-1" aria-hidden />
      <div
        className="pointer-events-none flex w-full min-h-[3rem] items-center justify-between gap-3 rounded-xl border-2 border-neutral-200 bg-white px-4 py-3 text-left shadow-md"
        aria-hidden
      >
        <div className="h-5 w-[40%] max-w-[12rem] animate-pulse rounded bg-neutral-200/90" />
        <div className="h-6 w-6 shrink-0 animate-pulse rounded bg-neutral-200/70" />
      </div>
    </div>
  )

  return (
    <div
      className="flex w-full min-w-0 shrink-0 flex-col gap-3 px-0 py-1 sm:gap-4"
      aria-busy="true"
    >
      {mobileHeader}
      {desktopTabs}

      <div className={SOCIAL_PANEL_SHELL_CLASS}>
        <div className="h-full w-full">
          <SocialListSkeleton />
        </div>
      </div>
    </div>
  )
}
