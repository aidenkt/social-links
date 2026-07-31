'use client'

import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
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
import { LINK_SECTIONS } from '../lib/links'
import { captureEvent } from '../lib/posthog-capture'

const socialListSectionTransition = {
  initial: { opacity: 0, y: 10, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, filter: 'blur(5px)' },
  transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
}

function SocialListSectionLayer({
  sectionId,
  children,
  reduceMotion,
}: {
  sectionId: SectionId
  children: ReactNode
  reduceMotion: boolean
}) {
  const [layoutClass] = useState(() => getSocialListInnerLayoutClass(sectionId))

  return (
    <motion.div
      {...socialListSectionTransition}
      initial={reduceMotion ? false : socialListSectionTransition.initial}
      transition={reduceMotion ? { duration: 0 } : socialListSectionTransition.transition}
      className={layoutClass}
    >
      {children}
    </motion.div>
  )
}

// Define the sections array with section IDs as 'id'
const sections = LINK_SECTIONS.map(({ id, label, description }) => ({
  id,
  label,
  content: description,
}))

// Render each section's cards from the shared link data (see lib/links.ts),
// keeping the interactive UI and the agent-facing /llms.txt in perfect sync.
const customComponents: Record<SectionId, () => JSX.Element> = LINK_SECTIONS.reduce(
  (acc, section) => {
    acc[section.id] = () => (
      <div className={SOCIAL_LIST_CLASS}>
        {section.links.map((link) => (
          <SocialAccount
            key={`${link.platform}-${link.url}`}
            src={link.icon}
            name={link.handle}
            platform={link.platform}
            cta={link.cta}
            link={link.url}
            buttonColor={link.buttonColor}
            textColor={link.textColor}
          />
        ))}
      </div>
    )
    return acc
  },
  {} as Record<SectionId, () => JSX.Element>,
)

const SECTION_MENU_ID = 'section-picker-menu'
const SECTION_PANEL_ID = 'section-picker-panel'

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
  const menuItemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [menuMaxHeightPx, setMenuMaxHeightPx] = useState<number | null>(null)
  const reduceMotion = useReducedMotion() ?? false

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
	captureEvent('section_changed', {
	  section: sectionId,
	  previous_section: activeSection,
	})
	setActiveSection(sectionId)
	setIsDropdownOpen(false)
  }

  const handleMenuSectionChange = (sectionId: SectionId) => {
    handleSectionChange(sectionId)
    requestAnimationFrame(() => menuTriggerRef.current?.focus())
  }

  const focusMenuItem = (index: number) => {
    menuItemRefs.current[index]?.focus()
  }

  const handleMenuItemKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = sections.length - 1
    let nextIndex: number | null = null

    if (event.key === 'ArrowDown') nextIndex = index === lastIndex ? 0 : index + 1
    if (event.key === 'ArrowUp') nextIndex = index === 0 ? lastIndex : index - 1
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = lastIndex
    if (event.key === 'Escape') {
      event.preventDefault()
      setIsDropdownOpen(false)
      menuTriggerRef.current?.focus()
      return
    }

    if (nextIndex != null) {
      event.preventDefault()
      focusMenuItem(nextIndex)
    }
  }

  const handleMenuTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

    event.preventDefault()
    setIsDropdownOpen(true)
    const activeIndex = sections.findIndex((section) => section.id === activeSection)
    const index = event.key === 'ArrowDown' ? activeIndex : sections.length - 1
    requestAnimationFrame(() => focusMenuItem(Math.max(0, index)))
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = sections.length - 1
    let nextIndex: number | null = null

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = index === lastIndex ? 0 : index + 1
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = index === 0 ? lastIndex : index - 1
    }
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = lastIndex
    if (nextIndex == null) return

    event.preventDefault()
    const nextSection = sections[nextIndex]
    tabRefs.current[nextIndex]?.focus()
    handleSectionChange(nextSection.id as SectionId)
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
		  <div className="-mt-1 px-2 py-1 md:-mt-1.5 md:py-1.5">{headlineEl}</div>
		  <div className={SOCIAL_LIST_SLOT_CLASS}>
			<AnimatePresence mode="wait" initial={false}>
			  <SocialListSectionLayer key={activeSection} sectionId={activeSection} reduceMotion={reduceMotion}>
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
		    initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.985 }}
		    animate={{ opacity: 1, y: 0, scale: 1 }}
		    transition={reduceMotion ? { duration: 0 } : mobileIntroTransition}
		    className="flex flex-col gap-3 overflow-visible"
		  >
		  <div className="px-1 text-center">{headlineEl}</div>
		  <div className={`relative overflow-visible ${isDropdownOpen ? 'z-30' : 'z-10'}`}>
		  <button
			ref={menuTriggerRef}
			type="button"
			  onClick={() => {
				  const next = !isDropdownOpen
				  captureEvent('section_dropdown_toggled', { open: next })
				  setIsDropdownOpen(next)
				}}
				onKeyDown={handleMenuTriggerKeyDown}
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
				initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: -6, scale: 0.98 }}
				transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
				id={SECTION_MENU_ID}
				role="menu"
				aria-label="Link categories"
				className={SECTION_MENU_PANEL_CLASS}
				style={
				  menuMaxHeightPx != null ? { maxHeight: menuMaxHeightPx } : undefined
				}
			  >
				{sections.map((section, index) => (
				  <button
					type="button"
					key={section.id}
					ref={(element) => { menuItemRefs.current[index] = element }}
					role="menuitem"
					onClick={() => handleMenuSectionChange(section.id as SectionId)}
					onKeyDown={(event) => handleMenuItemKeyDown(event, index)}
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
		    <SocialListSectionLayer key={activeSection} sectionId={activeSection} reduceMotion={reduceMotion}>
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
			{sections.map((section, index) => (
			  <button
				type="button"
				key={section.id}
				ref={(element) => { tabRefs.current[index] = element }}
				role="tab"
				id={`section-tab-${section.id}`}
				aria-controls={SECTION_PANEL_ID}
				aria-selected={activeSection === section.id}
				tabIndex={activeSection === section.id ? 0 : -1}
				onClick={() => handleSectionChange(section.id as SectionId)}
				onKeyDown={(event) => handleTabKeyDown(event, index)}
				className={getDesktopNavTabClassName(activeSection === section.id, true)}
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
	  <div
		className={`${socialPanelShellClass} max-md:hidden`}
		id={SECTION_PANEL_ID}
		role="tabpanel"
		aria-labelledby={`section-tab-${activeSection}`}
	  >
		  <div aria-hidden className={GLASS_PANEL_SHIM_CLASS} />
		  <div aria-hidden className={GLASS_PANEL_BRAND_TINT_CLASS} />
		  <div className="relative z-10 w-full">
		    <div className={SOCIAL_LIST_SLOT_CLASS}>
		      <AnimatePresence mode="wait" initial={false}>
		        <SocialListSectionLayer key={activeSection} sectionId={activeSection} reduceMotion={reduceMotion}>
		          {renderContent()}
		        </SocialListSectionLayer>
		      </AnimatePresence>
		    </div>
		  </div>
	  </div>
	</div>
  )
}
