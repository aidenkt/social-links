'use client'

import { useState, useEffect, useLayoutEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import SocialAccount from './SocialAccount'
import SectionPickerSkeleton from './SectionPickerSkeleton'
import { SOCIAL_PANEL_SHELL_CLASS } from '../lib/social-panel'
import {
  BACKGROUND_READY_ATTR,
  BACKGROUND_READY_EVENT,
} from '../lib/background-ready'
import { normalizeSectionParam, type SectionId } from '../lib/sections'

// Define the sections array with section IDs as 'id'
const sections = [
  { id: 'primary', label: 'Primary', content: 'Primary content goes here' },
  { id: 'text', label: 'Text', content: 'Text content goes here' },
  { id: 'photos', label: 'Photos', content: 'Photo gallery goes here' },
  { id: 'videos', label: 'Videos', content: 'Video player goes here' },
  { id: 'playlists', label: 'Playlists', content: 'Playlist player goes here' },
  { id: 'work', label: 'Work', content: 'Work portfolio goes here' },
  { id: 'contact', label: 'Contact', content: 'Contact form goes here' },
]

// Define the customComponents object with SectionId keys
const customComponents: Record<SectionId, () => JSX.Element> = {
  primary: () => (
	<div className="grid grid-cols-1 gap-2">
	  <SocialAccount
		src="/platform/instagram.webp"
		name="@aidentabrizi"
		platform="Instagram"
		cta="Follow"
		link="https://instagram.com/aidentabrizi"
		buttonColor="#FF0068"
	  />
	  <SocialAccount
		src="/platform/twitter.webp"
		name="@aiden_kt"
		platform="Twitter"
		cta="Follow"
		link="https://twitter.com/aiden_kt"
		buttonColor="#2188F6"
	  />
	  <SocialAccount
		src="/platform/snapchat.webp"
		name="aiden.kt"
		platform="Snapchat"
		cta="Add"
		link="https://snapchat.com/t/RrTkU4U4"
		buttonColor="#FFFC00"
		textColor="black"
	  />
	</div>
  ),
  text: () => (
	<div className="grid grid-cols-1 gap-2">
	  <SocialAccount
		src="/platform/bluesky.webp"
		name="@aiden.social"
		platform="Bluesky"
		cta="Follow"
		link="https://bsky.app/profile/aiden.social"
		buttonColor="#0A7AFF"
	  />
	  <SocialAccount
		src="/platform/threads.webp"
		name="@aidentabrizi"
		platform="Threads"
		cta="Follow"
		link="https://www.threads.net/@aidentabrizi"
		buttonColor="#000000"
	  />
	  <SocialAccount
		src="/platform/medium.webp"
		name="AidenKT"
		platform="Medium"
		cta="Follow"
		link="https://medium.com/@aidenkt"
		buttonColor="#000000"
	  />
	</div>
  ),
  photos: () => (
	<div className="grid grid-cols-1 gap-2">
	  <SocialAccount
		src="/platform/instagram.webp"
		name="@aidentabrizi"
		platform="Instagram"
		cta="Follow"
		link="https://instagram.com/aidentabrizi"
		buttonColor="#FF0068"
	  />
	</div>
  ),
  videos: () => (
	<div className="grid grid-cols-1 gap-2">
	  <SocialAccount
		src="/platform/youtube.webp"
		name="@aidenkt"
		platform="YouTube"
		cta="Subscribe"
		link="https://www.youtube.com/@aidenkt"
		buttonColor="#FF0000"
	  />
	  <SocialAccount
		src="/platform/tiktok.webp"
		name="@aidenkt"
		platform="TikTok"
		cta="Follow"
		link="https://www.tiktok.com/@aidenkt"
		buttonColor="#EE1D52"
	  />
	</div>
  ),
  playlists: () => (
	<div className="grid grid-cols-1 gap-2">
	  <SocialAccount
		src="/platform/applemusic.webp"
		name="@aidenkt"
		platform="Apple Music"
		cta="Follow"
		link="https://music.apple.com/profile/aidenkt"
		buttonColor="#FF0436"
	  />
	  <SocialAccount
		src="/platform/spotify.webp"
		name="aidenkt"
		platform="Spotify"
		cta="Follow"
		link="https://open.spotify.com/user/aidentab"
		buttonColor="#1ED760"
	  />
	  <SocialAccount
		src="/platform/tidal.webp"
		name="@aidenkt"
		platform="Tidal"
		cta="Follow"
		link="https://tidal.com/@aidenkt"
		buttonColor="#000000"
	  />
	</div>
  ),
  work: () => (
	<div className="grid grid-cols-1 gap-2">
	  <SocialAccount
		src="/platform/linkedin.webp"
		name="Aiden Tabrizi"
		platform="LinkedIn"
		cta="Connect"
		link="https://www.linkedin.com/in/aidenkt/"
		buttonColor="#0A66C2"
	  />
	  <SocialAccount
		src="/platform/handshake.webp"
		name="aidenkt"
		platform="Handshake"
		cta="Connect"
		link="https://app.joinhandshake.com/profiles/aidenkt"
		buttonColor="#D3FC53"
		textColor="black"
	  />
	  <SocialAccount
		src="/platform/github.webp"
		name="aidenkt"
		platform="GitHub"
		cta="Follow"
		link="https://github.com/AidenKT"
		buttonColor="#000000"
	  />
	</div>
  ),
  contact: () => (
	<div className="grid grid-cols-1 gap-2">
	  <SocialAccount
		src="/platform/mail.webp"
		name="hi@aidenkt.com"
		platform="Email"
		cta="Email"
		link="mailto:hi@aidenkt.com"
	  />
	  <SocialAccount
		src="/platform/discord.webp"
		name="discord.gg/akt"
		platform="Discord"
		cta="Join"
		link="https://discord.gg/akt"
		buttonColor="#5865F2"
	  />
	</div>
  ),
};

const SECTION_MENU_ID = 'section-picker-menu'

type SectionPickerProps = {
  headlineFontClassName: string
  headlineLines: ReactNode
  initialSection?: SectionId
  showSectionControls?: boolean
}

export default function SectionPicker({
  headlineFontClassName,
  headlineLines,
  initialSection = 'primary',
  showSectionControls = true,
}: SectionPickerProps) {
  const pathname = usePathname()
  const [activeSection, setActiveSection] = useState<SectionId>(initialSection)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Read query params from the URL without `useSearchParams()` (that hook suspends and can
  // leave the route stuck on the Suspense fallback after client navigations back to `/`).
  useEffect(() => {
    if (!showSectionControls) return
    if (typeof window === 'undefined') return

    const queryKeys = Array.from(new URLSearchParams(window.location.search).keys())
    for (const key of queryKeys) {
      const mappedSection = normalizeSectionParam(key)
      if (mappedSection) {
        setActiveSection(mappedSection)
        break
      }
    }
  }, [showSectionControls, pathname])

  useLayoutEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768)
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  const [bgReady, setBgReady] = useState(false)

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return
    if (document.documentElement.getAttribute(BACKGROUND_READY_ATTR) === '1') {
      setBgReady(true)
    }
  }, [])

  useEffect(() => {
    const onReady = () => setBgReady(true)
    if (typeof document !== 'undefined' && document.documentElement.getAttribute(BACKGROUND_READY_ATTR) === '1') {
      setBgReady(true)
      return
    }
    window.addEventListener(BACKGROUND_READY_EVENT, onReady)
    return () => window.removeEventListener(BACKGROUND_READY_EVENT, onReady)
  }, [])

  if (!bgReady) {
    return (
      <SectionPickerSkeleton
        headlineFontClassName={headlineFontClassName}
        headlineLines={headlineLines}
        showSectionControls={showSectionControls}
        activeSectionId={initialSection}
        sectionSummaries={sections.map(({ id, label }) => ({ id, label }))}
      />
    )
  }

  const handleSectionChange = (sectionId: SectionId) => {
	setActiveSection(sectionId)
	setIsDropdownOpen(false)
  }

  const activeLabel = sections.find((section) => section.id === activeSection)?.label

  const renderContent = () => {
	const CustomComponent = customComponents[activeSection]
	if (CustomComponent) {
	  return <CustomComponent />
	}
	return sections.find((section) => section.id === activeSection)?.content
  }

  const headlineEl = (
	<p
	  className={`${headlineFontClassName} w-full text-center text-2xl font-semibold text-neutral-900 sm:text-[1.3rem]`}
	>
	  {headlineLines}
	</p>
  )

  const mobileIntroTransition = {
	duration: 0.5,
	ease: [0.22, 1, 0.36, 1] as const,
  }

  if (!showSectionControls) {
	return (
	  <div className="flex w-full min-w-0 shrink-0 flex-col gap-3 px-0 py-1 sm:gap-4">
		<div className="relative isolate w-full overflow-hidden rounded-2xl border border-white/55 bg-white/30 p-3 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.04] backdrop-blur-xl [backdrop-filter:saturate(130%)_blur(20px)]">
		  <div
			aria-hidden
			className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0.12)_44%,rgba(255,255,255,0.08)_100%),radial-gradient(130%_65%_at_14%_-12%,rgba(255,120,185,0.12)_0%,rgba(255,120,185,0)_46%),radial-gradient(140%_80%_at_88%_0%,rgba(90,170,255,0.12)_0%,rgba(90,170,255,0)_48%),radial-gradient(160%_95%_at_58%_102%,rgba(255,210,120,0.10)_0%,rgba(255,210,120,0)_52%)]"
		  />
		  <div className="relative z-10 px-2 py-1 sm:py-2">{headlineEl}</div>
		  <div className="relative z-10 mt-2 max-sm:mt-3">
			<AnimatePresence mode="wait" initial={false}>
			  <motion.div
				key={activeSection}
				initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
				animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
				exit={{ opacity: 0, y: -8, filter: 'blur(5px)' }}
				transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
				className="h-full w-full"
			  >
				{renderContent()}
			  </motion.div>
			</AnimatePresence>
		  </div>
		</div>
	  </div>
	)
  }

  return (
	<div className="flex w-full min-w-0 shrink-0 flex-col gap-3 px-0 py-1 sm:gap-4">
	  {showSectionControls ? (isMobile ? (
		<motion.div
		  initial={{ opacity: 0, y: 10, scale: 0.985 }}
		  animate={{ opacity: 1, y: 0, scale: 1 }}
		  transition={mobileIntroTransition}
		  className="relative z-10 mb-3 flex min-h-[9.5rem] flex-col sm:mb-4"
		>
		  <div className="min-h-0 flex-1" aria-hidden />
		  <div className="shrink-0 px-2">{headlineEl}</div>
		  <div className="min-h-0 flex-1" aria-hidden />
		  <button
			type="button"
			onClick={() => setIsDropdownOpen(!isDropdownOpen)}
			className="flex w-full min-h-[3rem] items-center justify-between gap-3 rounded-xl border-2 border-neutral-200 bg-white px-4 py-3 text-left shadow-md transition-[transform,box-shadow,background-color,border-color] active:scale-[0.99] active:bg-neutral-50 active:shadow-sm hover:border-neutral-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/35 focus-visible:ring-offset-2 [-webkit-tap-highlight-color:transparent]"
			aria-expanded={isDropdownOpen}
			aria-haspopup="menu"
			aria-controls={isDropdownOpen ? SECTION_MENU_ID : undefined}
			aria-label={`Change link category (now ${activeLabel ?? 'section'})`}
		  >
			<span className="text-base font-semibold text-neutral-900">{activeLabel}</span>
			<ChevronDown className={`h-6 w-6 shrink-0 text-neutral-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={2.25} />
		  </button>
		  <AnimatePresence>
			{isDropdownOpen && (
			  <motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -10 }}
				transition={{ duration: 0.2 }}
				id={SECTION_MENU_ID}
				role="menu"
				aria-label="Link categories"
				className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border-2 border-neutral-200 bg-white py-1.5 shadow-lg"
			  >
				{sections.map((section) => (
				  <button
					type="button"
					key={section.id}
					role="menuitem"
					onClick={() => handleSectionChange(section.id as SectionId)}
					className={`flex min-h-[2.75rem] w-full items-center px-4 py-3 text-left text-base transition-colors duration-150 active:bg-neutral-200/80 hover:bg-neutral-100 focus:outline-none focus-visible:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/20 ${
					  activeSection === section.id ? 'bg-neutral-100 font-semibold text-black' : 'font-medium text-neutral-800'
					}`}
				  >
					{section.label}
				  </button>
				))}
			  </motion.div>
			)}
		  </AnimatePresence>
		</motion.div>
	  ) : (
		<div className="relative left-1/2 mb-3 hidden w-[100dvw] max-w-[100dvw] -translate-x-1/2 px-4 sm:mb-4 sm:block">
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
		        className="pointer-events-auto relative z-10 inline-flex w-max max-w-full flex-nowrap gap-0.5 overflow-x-auto rounded-full border border-black/[0.06] bg-[#f7f7f7] px-1 py-1 shadow-[0_12px_28px_-18px_rgba(0,0,0,0.45)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
		        role="tablist"
		      >
			{sections.map((section) => (
			  <button
				type="button"
				key={section.id}
				onClick={() => setActiveSection(section.id as SectionId)}
				className={`shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/35 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 sm:px-4 sm:text-sm ${
				  activeSection === section.id
					? 'border border-neutral-200/80 bg-white text-black shadow-sm'
					: 'text-neutral-600 hover:text-black'
				}`}
				aria-pressed={activeSection === section.id}
			  >
				{section.label}
			  </button>
			))}
		      </div>
		    </div>
		  </div>
		</div>
	  )) : (
		<div className="mb-3 px-2 py-1 sm:mb-4 sm:py-2">
		  {headlineEl}
		</div>
	  )}
	  {isMobile ? (
		<motion.div
		  initial={{ opacity: 0, y: 12, scale: 0.985 }}
		  animate={{ opacity: 1, y: 0, scale: 1 }}
		  transition={{ ...mobileIntroTransition, delay: 0.08 }}
		  className={SOCIAL_PANEL_SHELL_CLASS}
		>
		  <div key={activeSection} className="h-full w-full">
			{renderContent()}
		  </div>
		</motion.div>
	  ) : (
		<div className={SOCIAL_PANEL_SHELL_CLASS}>
		  <AnimatePresence mode="wait" initial={false}>
			<motion.div
			  key={activeSection}
			  initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
			  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
			  exit={{ opacity: 0, y: -8, filter: 'blur(5px)' }}
			  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
			  className="h-full w-full"
			>
			  {renderContent()}
			</motion.div>
		  </AnimatePresence>
		</div>
	  )}
	</div>
  )
}
