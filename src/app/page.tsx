import Image from "next/image";
import BackgroundRoot from '../components/BackgroundRoot';
import SectionPicker from '../components/SectionPicker';
import TrackedOutboundLink from '../components/TrackedOutboundLink';
import { buildPersonJsonLd } from '../lib/site';
import { Oswald } from 'next/font/google'

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

export default function Home() {
  const personJsonLd = buildPersonJsonLd()

  return (
    <div className="relative grid h-full min-h-0 w-full max-w-full grid-rows-[auto_minmax(0,1fr)_auto] items-center justify-items-center gap-4 overflow-x-visible overflow-y-hidden pb-6 max-md:max-h-[100dvh] max-md:overscroll-none md:min-h-screen md:max-h-none md:grid-rows-[20px_minmax(0,1fr)_20px] md:gap-12 md:overflow-x-visible md:overflow-y-visible md:p-20 md:pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <BackgroundRoot />

      <main className="row-start-2 z-10 flex min-h-0 w-full max-w-md flex-col justify-self-center px-4 pt-6 max-sm:pt-10 sm:px-6 max-md:relative max-md:z-20 md:px-0 md:pt-4">
        <div className="flex flex-col gap-3 md:gap-8">

        <SectionPicker headlineFontClassName={oswald.className} headlineLines={headlineLines} />
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
          <Image
            aria-hidden
            src="/globe.svg"
            alt=""
            width={16}
            height={16}
          />
          Explore more →
        </TrackedOutboundLink>
      </footer>
    </div>
  );
}
