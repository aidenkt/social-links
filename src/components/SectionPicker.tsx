'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import SocialAccount from './SocialAccount'

// Define valid section IDs
type SectionId = 'primary' | 'text' | 'photos' | 'videos' | 'playlists' | 'work' | 'contact';

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
		src="/platform/github.webp"
		name="AidenKT"
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
		name="discord.gg/YKKAqrs"
		platform="Discord"
		cta="Join"
		link="https://discord.gg/YKKAqrs"
		buttonColor="#5865F2"
	  />
	</div>
  ),
};

// Map query parameter names to section IDs
const querySectionMap: Record<string, SectionId> = {
  'primary': 'primary',
  'text': 'text',
  'photos': 'photos',
  'videos': 'videos',
  'playlists': 'playlists',
  'music': 'playlists', // Alias for playlists
  'work': 'work',
  'contact': 'contact',
}

export default function Component() {
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState<SectionId>('primary')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Handle query string parameters on mount
  useEffect(() => {
    // Check for query parameters (e.g., ?work, ?music, ?contact)
    const queryKeys = Array.from(searchParams.keys())
    for (const key of queryKeys) {
      const mappedSection = querySectionMap[key.toLowerCase()]
      if (mappedSection) {
        setActiveSection(mappedSection)
        break // Use the first valid query parameter
      }
    }
  }, [searchParams])

  useEffect(() => {
	const checkIsMobile = () => setIsMobile(window.innerWidth < 768)
	checkIsMobile()
	window.addEventListener('resize', checkIsMobile)
	return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

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

  return (
	<div className="w-full max-w-4xl mx-auto p-4 flex flex-col h-[450px]">
	  {isMobile ? (
		<div className="p-2 relative mb-5 z-10">
		  <button
			onClick={() => setIsDropdownOpen(!isDropdownOpen)}
			className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
		  >
			<span className="font-medium">{activeLabel}</span>
			<ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
		  </button>
		  <AnimatePresence>
			{isDropdownOpen && (
			  <motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -10 }}
				transition={{ duration: 0.2 }}
				className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
			  >
				{sections.map((section) => (
				  <button
					key={section.id}
					onClick={() => handleSectionChange(section.id as SectionId)}
					className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-200 ${
					  activeSection === section.id ? 'bg-blue-50 text-blue-600' : ''
					}`}
				  >
					{section.label}
				  </button>
				))}
			  </motion.div>
			)}
		  </AnimatePresence>
		</div>
	  ) : (
		<div className="flex justify-center mb-5 bg-gray-100 p-1 rounded-full">
		  {sections.map((section) => (
			<button
			  key={section.id}
			  onClick={() => setActiveSection(section.id as SectionId)}
			  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
				activeSection === section.id
				  ? 'bg-white text-black shadow'
				  : 'text-gray-600 hover:text-black'
			  }`}
			  aria-pressed={activeSection === section.id}
			>
			  {section.label}
			</button>
		  ))}
		</div>
	  )}
	  <div className="flex-grow overflow-auto">
		<AnimatePresence mode="wait">
		  <motion.div
			key={activeSection}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.2 }}
			className="p-2 rounded-lg shadow-lg h-full overflow-auto"
		  >
			{renderContent()}
		  </motion.div>
		</AnimatePresence>
	  </div>
	</div>
  )
}
