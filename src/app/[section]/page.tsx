import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Oswald } from 'next/font/google'
import BackgroundRoot from '../../components/BackgroundRoot'
import SectionPicker from '../../components/SectionPicker'
import SectionPageTracker from '../../components/SectionPageTracker'
import TrackedOutboundLink from '../../components/TrackedOutboundLink'
import { normalizeSectionParam, STATIC_SECTION_PATHS } from '../../lib/sections'

const oswald = Oswald({
  weight: '500',
  subsets: ['latin'],
})

const headlineLines = (
  <>
    <span className="block md:inline">{"There's more where "}</span>
    <span className="block md:inline">{"that came from."}</span>
  </>
)

type SectionPageProps = {
  params: Promise<{
    section: string
  }>
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { section } = await params
  const normalizedSection = normalizeSectionParam(section)
  if (!normalizedSection) notFound()

  return (
    <div className="relative grid h-full min-h-0 w-full max-w-full grid-rows-[auto_minmax(0,1fr)_auto] items-center justify-items-center gap-4 overflow-x-visible overflow-y-hidden pb-6 max-md:max-h-[100dvh] max-md:overscroll-none md:min-h-screen md:max-h-none md:grid-rows-[20px_minmax(0,1fr)_20px] md:gap-12 md:overflow-x-visible md:overflow-y-visible md:p-20 md:pb-24">
      <BackgroundRoot />
      <SectionPageTracker section={normalizedSection} />

      <main className="row-start-2 z-10 flex min-h-0 w-full max-w-md flex-col justify-self-center px-4 pt-6 max-sm:pt-10 sm:px-6 max-md:relative max-md:z-20 md:px-0 md:pt-4">
        <div className="flex flex-col gap-3 md:gap-8">
          <SectionPicker
            headlineFontClassName={oswald.className}
            headlineLines={headlineLines}
            initialSection={normalizedSection}
            showSectionControls={false}
          />
        </div>
      </main>
      <footer className="row-start-3 z-10 flex w-full max-w-md shrink-0 flex-wrap items-center justify-center justify-self-center px-4 py-2 text-sm text-black max-md:relative max-md:z-0">
        <TrackedOutboundLink
          className="flex items-center gap-2 rounded-md py-1 text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/35 focus-visible:ring-offset-2 hover:underline hover:underline-offset-4"
          href="https://aidenkt.com"
          target="_blank"
          rel="noopener noreferrer"
          analyticsLabel="Explore more"
          analyticsSource="footer"
        >
          <Image aria-hidden src="/globe.svg" alt="" width={16} height={16} />
          Explore more →
        </TrackedOutboundLink>
      </footer>
    </div>
  )
}

export function generateStaticParams() {
  return STATIC_SECTION_PATHS.map((section) => ({ section }))
}
