'use client'

import { useState, useEffect, useLayoutEffect, useCallback, useRef, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import SocialAccount from './SocialAccount'
import SectionPickerSkeleton from './SectionPickerSkeleton'
import GlassPanel from './GlassPanel'
import {
  DESKTOP_NAV_BRIDGE_CLASS,
  DESKTOP_NAV_CAP_CLASS,
  DESKTOP_NAV_CAP_SHELL_CLASS,
  DESKTOP_NAV_CAP_STROKE_CLASS,
  DESKTOP_NAV_CAP_WRAP_CLASS,
  DESKTOP_NAV_TABS_CLASS,
  GLASS_PANEL_MENU_OVERFLOW_CLASS,
  GLASS_PANEL_PADDING_CLASS,
  GLASS_PANEL_BRAND_TINT_CLASS,
  GLASS_PANEL_SHIM_CLASS,
  SOCIAL_LIST_CLASS,
  getDesktopNavTabClassName,
  getSectionMenuItemClassName,
  getSocialListInnerLayoutClass,
  getSocialPanelShellClass,
  SOCIAL_LIST_SLOT_CLASS,
  SECTION_MENU_PANEL_CLASS,
  SECTION_MENU_MIN_SCROLL_HEIGHT_PX,
  SECTION_MENU_TRIGGER_CLASS,
} from '../lib/social-panel'
import {
  BACKGROUND_READY_ATTR,
  BACKGROUND_READY_EVENT,
} from '../lib/background-ready'
import { normalizeSectionParam, type SectionId } from '../lib/sections'

const socialListSectionTransition = {
  initial: { opacity: 0, y: 10, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, filter: 'blur(5px)' },
  transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
}

function SocialListSectionLayer({
  sectionId,
  children,
}: {
  sectionId: SectionId
  children: ReactNode
}) {
  const [layoutClass] = useState(() => getSocialListInnerLayoutClass(sectionId))

  return (
    <motion.div {...socialListSectionTransition} className={layoutClass}>
      {children}
    </motion.div>
  )
}

// Define the sections array with section IDs as 'id'
const sections = [
  { id: 'main', label: 'Main', content: 'Main socials go here' },
  { id: 'text', label: 'Text', content: 'Text-based platforms go here' },
  { id: 'photos', label: 'Photos', content: 'Photo sharing goes here' },
  { id: 'videos', label: 'Videos', content: 'Video platforms go here' },
  { id: 'playlists', label: 'Playlists', content: 'Music accounts go here' },
  { id: 'work', label: 'Work', content: 'Work profiles go here' },
  { id: 'contact', label: 'Contact', content: 'Contact links go here' },
]

// Define the customComponents object with SectionId keys
const customComponents: Record<SectionId, () => JSX.Element> = {
  main: () => (
	<div className={SOCIAL_LIST_CLASS}>
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
	<div className={SOCIAL_LIST_CLASS}>
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
	<div className={SOCIAL_LIST_CLASS}>
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
	<div className={SOCIAL_LIST_CLASS}>
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
	<div className={SOCIAL_LIST_CLASS}>
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
	<div className={SOCIAL_LIST_CLASS}>
	  <SocialAccount
		src="/platform/linkedin.webp"
		name="Aiden Tabrizi"
		platform="LinkedIn"
		cta="Connect"
		link="https://www.linkedin.com/in/aidenkt/"
		buttonColor="#0A66C2"
	  />
	  <SocialAccount
		src="/platform/github.webp"
		name="aidenkt"
		platform="GitHub"
		cta="Follow"
		link="https://github.com/AidenKT"
		buttonColor="#000000"
	  />
	  <SocialAccount
		src="/platform/handshake.webp"
		name="Aiden Tabrizi"
		platform="Handshake"
		cta="Connect"
		link="https://app.joinhandshake.com/profiles/aidenkt"
		buttonColor="#D3FC53"
		textColor="black"
	  />
	</div>
  ),
  contact: () => (
	<div className={SOCIAL_LIST_CLASS}>
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
  initialSection = 'main',
  showSectionControls = true,
}: SectionPickerProps) {
  const pathname = usePathname()
  const [activeSection, setActiveSection] = useState<SectionId>(initialSection)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const [menuMaxHeightPx, setMenuMaxHeightPx] = useState<number | null>(null)

  const updateMenuMaxHeight = useCallback(() => {
    const trigger = menuTriggerRef.current
    if (!trigger) return

    const vv = window.visualViewport
    const viewportHeight = vv?.height ?? window.innerHeight
    const viewportTop = vv?.offsetTop ?? 0
    const triggerRect = trigger.getBoundingClientRect()
    const gapBelowTrigger = 10
    const bottomInset = 12
    const available =
      viewportTop + viewportHeight - triggerRect.bottom - gapBelowTrigger - bottomInset

    setMenuMaxHeightPx(Math.max(SECTION_MENU_MIN_SCROLL_HEIGHT_PX, Math.floor(available)))
  }, [])

  useLayoutEffect(() => {
    if (!isDropdownOpen) {
      setMenuMaxHeightPx(null)
      return
    }

    updateMenuMaxHeight()
    const vv = window.visualViewport
    const onViewportChange = () => updateMenuMaxHeight()
    vv?.addEventListener('resize', onViewportChange)
    vv?.addEventListener('scroll', onViewportChange)
    window.addEventListener('resize', onViewportChange)

    return () => {
      vv?.removeEventListener('resize', onViewportChange)
      vv?.removeEventListener('scroll', onViewportChange)
      window.removeEventListener('resize', onViewportChange)
    }
  }, [isDropdownOpen, updateMenuMaxHeight])

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
  const socialPanelShellClass = getSocialPanelShellClass(activeSection)

  const renderContent = () => {
	const CustomComponent = customComponents[activeSection]
	if (CustomComponent) {
	  return <CustomComponent />
	}
	return sections.find((section) => section.id === activeSection)?.content
  }

  const headlineEl = (
	<p
	  className={`${headlineFontClassName} w-full text-center text-2xl font-semibold text-neutral-900 md:text-[1.3rem]`}
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
	  <div className="flex w-full min-w-0 shrink-0 flex-col gap-3 px-0 py-1 md:gap-3">
		<GlassPanel className={GLASS_PANEL_PADDING_CLASS}>
		  <div className="px-2 py-1 md:py-1.5">{headlineEl}</div>
		  <div className={SOCIAL_LIST_SLOT_CLASS}>
			<AnimatePresence mode="wait" initial={false}>
			  <SocialListSectionLayer key={activeSection} sectionId={activeSection}>
				{renderContent()}
			  </SocialListSectionLayer>
			</AnimatePresence>
		  </div>
		</GlassPanel>
	  </div>
	)
  }

  return (
	<div className="flex w-full min-w-0 shrink-0 flex-col gap-3 px-0 py-1 md:gap-3">
	  {showSectionControls ? (
	    <>
	      <GlassPanel
		  className={`${GLASS_PANEL_MENU_OVERFLOW_CLASS} gap-3 ${GLASS_PANEL_PADDING_CLASS} md:hidden`}
		  contentClassName="flex min-h-0 flex-col gap-3 overflow-visible"
		>
		  <motion.div
		    initial={{ opacity: 0, y: 10, scale: 0.985 }}
		    animate={{ opacity: 1, y: 0, scale: 1 }}
		    transition={mobileIntroTransition}
		    className="flex flex-col gap-3 overflow-visible"
		  >
		  <div className="px-1 text-center">{headlineEl}</div>
		  <div className={`relative overflow-visible ${isDropdownOpen ? 'z-30' : 'z-10'}`}>
		  <button
			ref={menuTriggerRef}
			type="button"
			onClick={() => setIsDropdownOpen(!isDropdownOpen)}
			className={SECTION_MENU_TRIGGER_CLASS}
			aria-expanded={isDropdownOpen}
			aria-haspopup="menu"
			aria-controls={isDropdownOpen ? SECTION_MENU_ID : undefined}
			aria-label={`Change link category (now ${activeLabel ?? 'section'})`}
		  >
			<span className="min-w-0 text-base font-semibold text-neutral-900">{activeLabel}</span>
			<span className="section-menu-trigger-chevron" aria-hidden>
			  <ChevronDown
				className={`h-5 w-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
				strokeWidth={2.5}
			  />
			</span>
		  </button>
		  <AnimatePresence>
			{isDropdownOpen && (
			  <motion.div
				initial={{ opacity: 0, y: -8, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: -6, scale: 0.98 }}
				transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
				id={SECTION_MENU_ID}
				role="menu"
				aria-label="Link categories"
				className={SECTION_MENU_PANEL_CLASS}
				style={
				  menuMaxHeightPx != null ? { maxHeight: menuMaxHeightPx } : undefined
				}
			  >
				{sections.map((section) => (
				  <button
					type="button"
					key={section.id}
					role="menuitem"
					onClick={() => handleSectionChange(section.id as SectionId)}
					className={getSectionMenuItemClassName(activeSection === section.id)}
				  >
					{section.label}
				  </button>
				))}
			  </motion.div>
			)}
		  </AnimatePresence>
		  </div>
		</motion.div>
		<div className={`${SOCIAL_LIST_SLOT_CLASS} z-0`}>
		  <AnimatePresence mode="wait" initial={false}>
		    <SocialListSectionLayer key={activeSection} sectionId={activeSection}>
		      {renderContent()}
		    </SocialListSectionLayer>
		  </AnimatePresence>
		</div>
	      </GlassPanel>
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
		        className={`pointer-events-auto relative z-10 ${DESKTOP_NAV_TABS_CLASS}`}
		        role="tablist"
		      >
			{sections.map((section) => (
			  <button
				type="button"
				key={section.id}
				onClick={() => setActiveSection(section.id as SectionId)}
				className={getDesktopNavTabClassName(activeSection === section.id, true)}
				aria-pressed={activeSection === section.id}
			  >
				{section.label}
			  </button>
			))}
		      </div>
		    </div>
		  </div>
		</div>
	    </>
	  ) : (
		<div className="mb-3 px-2 py-1 md:mb-4 md:py-2">
		  {headlineEl}
		</div>
	  )}
	  <div className={`${socialPanelShellClass} max-md:hidden`}>
		  <div aria-hidden className={GLASS_PANEL_SHIM_CLASS} />
		  <div aria-hidden className={GLASS_PANEL_BRAND_TINT_CLASS} />
		  <div className="relative z-10 w-full">
		    <div className={SOCIAL_LIST_SLOT_CLASS}>
		      <AnimatePresence mode="wait" initial={false}>
		        <SocialListSectionLayer key={activeSection} sectionId={activeSection}>
		          {renderContent()}
		        </SocialListSectionLayer>
		      </AnimatePresence>
		    </div>
		  </div>
	  </div>
	</div>
  )
}
