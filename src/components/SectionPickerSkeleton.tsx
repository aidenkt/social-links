import type { ReactNode } from 'react'
import { SOCIAL_PANEL_SHELL_CLASS } from '../lib/social-panel'

type SectionPickerSkeletonProps = {
  headlineFontClassName: string
  headlineLines: ReactNode
}

export default function SectionPickerSkeleton({
  headlineFontClassName,
  headlineLines,
}: SectionPickerSkeletonProps) {
  return (
    <div
      className="flex w-full min-w-0 shrink-0 flex-col gap-3 px-0 py-1 sm:gap-4"
      aria-busy="true"
    >
      <div className="relative z-10 mb-3 flex min-h-[9.5rem] flex-col sm:hidden">
        <div className="min-h-0 flex-1" aria-hidden />
        <div className="shrink-0 px-2">
          <p
            className={`${headlineFontClassName} w-full text-center text-2xl font-semibold text-neutral-900`}
          >
            {headlineLines}
          </p>
        </div>
        <div className="min-h-0 flex-1" aria-hidden />
        <div className="w-full shrink-0 rounded-xl border-2 border-neutral-200 bg-white p-3 shadow-md">
          <div className="h-6 w-full animate-pulse rounded-md bg-neutral-200/80" />
        </div>
      </div>

      <div className="relative left-1/2 mb-3 hidden w-[100dvw] max-w-[100dvw] -translate-x-1/2 px-4 sm:mb-4 sm:block">
        <div className="relative mx-auto flex w-fit max-w-full flex-col items-center px-6 pt-3 pb-3 text-center">
          <div className="pointer-events-none absolute inset-x-0 top-2 h-20" aria-hidden>
            <div className="absolute left-1/2 top-0 h-20 w-[62%] -translate-x-1/2 rounded-[2rem] border-x border-t border-b-0 border-black/[0.05] bg-[#f7f7f7] shadow-[0_10px_24px_-18px_rgba(0,0,0,0.35)]" />
          </div>
          <div className="relative z-10 px-10 pt-1 pb-2">
            <p
              className={`${headlineFontClassName} w-full text-2xl font-semibold text-neutral-900 sm:text-[1.3rem]`}
            >
              {headlineLines}
            </p>
          </div>
          <div className="relative mx-auto w-max max-w-full">
            <div
              className="pointer-events-none absolute left-1/2 z-[11] h-[7px] w-[66.9%] -translate-x-1/2 rounded-none bg-[#f7f7f7]"
              style={{ top: '-5px' }}
              aria-hidden
            />
            <div className="relative z-10 inline-flex w-max gap-0.5 rounded-full border border-black/[0.06] bg-[#f7f7f7] px-1 py-1 shadow-[0_12px_28px_-18px_rgba(0,0,0,0.45)]">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-16 shrink-0 animate-pulse rounded-full bg-neutral-200/90 sm:w-20"
              />
            ))}
            </div>
          </div>
        </div>
      </div>

      <div className={SOCIAL_PANEL_SHELL_CLASS}>
        <div className="flex flex-col gap-2 p-2 max-sm:p-0">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-neutral-200/70 bg-white p-3 shadow-sm max-sm:border-0"
            >
              <div className="h-[50px] w-[50px] shrink-0 animate-pulse rounded-[22%] bg-neutral-200" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="h-4 w-28 max-w-full animate-pulse rounded bg-neutral-200" />
                <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
              </div>
              <div className="h-9 min-w-[5.75rem] shrink-0 animate-pulse rounded-full bg-neutral-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
