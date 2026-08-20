import type { SectionId } from './sections'

/**
 * Single source of truth for every profile/link rendered on the site.
 *
 * Both the interactive UI (`SectionPicker`) and the agent-facing `/llms.txt`
 * route read from this module, so the machine-readable summary can never drift
 * from what a human actually sees.
 */
export interface SocialLink {
  /** Human-readable platform name, e.g. "Instagram". */
  platform: string
  /** Displayed handle / address, e.g. "@aidentabrizi" or "hi@aidenkt.com". */
  handle: string
  /** Call-to-action button label, e.g. "Follow", "Email". */
  cta: string
  /** Destination URL (may be a mailto: link). */
  url: string
  /** Icon path under /public. */
  icon: string
  /** Optional brand color for the button + hover highlight. */
  buttonColor?: string
  /** Optional CTA text color (defaults to white). */
  textColor?: string
}

export interface LinkSection {
  id: SectionId
  label: string
  /** Fallback description shown when a section has no rendered links. */
  description: string
  links: SocialLink[]
}

export const LINK_SECTIONS: LinkSection[] = [
  {
    id: 'main',
    label: 'Main',
    description: 'Main socials go here',
    links: [
      {
        platform: 'Instagram',
        handle: '@aidentabrizi',
        cta: 'Follow',
        url: 'https://instagram.com/aidentabrizi',
        icon: '/platform/instagram.webp',
        buttonColor: '#FF0068',
      },
      {
        platform: 'Twitter',
        handle: '@aidnkt',
        cta: 'Follow',
        url: 'https://twitter.com/aidnkt',
        icon: '/platform/twitter.webp',
        buttonColor: '#2188F6',
      },
      {
        platform: 'LinkedIn',
        handle: 'Aiden Tabrizi',
        cta: 'Connect',
        url: 'https://www.linkedin.com/in/aidenkt/',
        icon: '/platform/linkedin.webp',
        buttonColor: '#0A66C2',
      },
    ],
  },
  {
    id: 'text',
    label: 'Text',
    description: 'Text-based platforms go here',
    links: [
      {
        platform: 'Bluesky',
        handle: '@aiden.social',
        cta: 'Follow',
        url: 'https://bsky.app/profile/aiden.social',
        icon: '/platform/bluesky.webp',
        buttonColor: '#0A7AFF',
      },
      {
        platform: 'Threads',
        handle: '@aidentabrizi',
        cta: 'Follow',
        url: 'https://www.threads.net/@aidentabrizi',
        icon: '/platform/threads.webp',
        buttonColor: '#000000',
      },
      {
        platform: 'Medium',
        handle: 'AidenKT',
        cta: 'Follow',
        url: 'https://medium.com/@aidenkt',
        icon: '/platform/medium.webp',
        buttonColor: '#000000',
      },
    ],
  },
  {
    id: 'photos',
    label: 'Photos',
    description: 'Photo sharing goes here',
    links: [
      {
        platform: 'Instagram',
        handle: '@aidentabrizi',
        cta: 'Follow',
        url: 'https://instagram.com/aidentabrizi',
        icon: '/platform/instagram.webp',
        buttonColor: '#FF0068',
      },
      {
        platform: 'Snapchat',
        handle: 'aiden.kt',
        cta: 'Add',
        url: 'https://snapchat.com/t/RrTkU4U4',
        icon: '/platform/snapchat.webp',
        buttonColor: '#FFFC00',
        textColor: 'black',
      },
    ],
  },
  {
    id: 'videos',
    label: 'Videos',
    description: 'Video platforms go here',
    links: [
      {
        platform: 'YouTube',
        handle: '@aidenkt',
        cta: 'Subscribe',
        url: 'https://www.youtube.com/@aidenkt',
        icon: '/platform/youtube.webp',
        buttonColor: '#FF0000',
      },
      {
        platform: 'TikTok',
        handle: '@aidenkt',
        cta: 'Follow',
        url: 'https://www.tiktok.com/@aidenkt',
        icon: '/platform/tiktok.webp',
        buttonColor: '#EE1D52',
      },
    ],
  },
  {
    id: 'playlists',
    label: 'Playlists',
    description: 'Music accounts go here',
    links: [
      {
        platform: 'Apple Music',
        handle: '@aidenkt',
        cta: 'Follow',
        url: 'https://music.apple.com/profile/aidenkt',
        icon: '/platform/applemusic.webp',
        buttonColor: '#FF0436',
      },
      {
        platform: 'Spotify',
        handle: 'aidenkt',
        cta: 'Follow',
        url: 'https://open.spotify.com/user/aidentab',
        icon: '/platform/spotify.webp',
        buttonColor: '#1ED760',
      },
      {
        platform: 'Tidal',
        handle: '@aidenkt',
        cta: 'Follow',
        url: 'https://tidal.com/@aidenkt',
        icon: '/platform/tidal.webp',
        buttonColor: '#000000',
      },
    ],
  },
  {
    id: 'work',
    label: 'Work',
    description: 'Work profiles go here',
    links: [
      {
        platform: 'LinkedIn',
        handle: 'Aiden Tabrizi',
        cta: 'Connect',
        url: 'https://www.linkedin.com/in/aidenkt/',
        icon: '/platform/linkedin.webp',
        buttonColor: '#0A66C2',
      },
      {
        platform: 'GitHub',
        handle: 'aidenkt',
        cta: 'Follow',
        url: 'https://github.com/AidenKT',
        icon: '/platform/github.webp',
        buttonColor: '#000000',
      },
      {
        platform: 'Handshake',
        handle: 'Aiden Tabrizi',
        cta: 'Connect',
        url: 'https://app.joinhandshake.com/profiles/aidenkt',
        icon: '/platform/handshake.webp',
        buttonColor: '#D3FC53',
        textColor: 'black',
      },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    description: 'Contact links go here',
    links: [
      {
        platform: 'Email',
        handle: 'hi@aidenkt.com',
        cta: 'Email',
        url: 'mailto:hi@aidenkt.com',
        icon: '/platform/mail.webp',
      },
      {
        platform: 'Email',
        handle: 'akt@berkeley.edu',
        cta: 'Email',
        url: 'mailto:akt@berkeley.edu',
        icon: '/platform/berkeley.webp',
        buttonColor: '#FDB515',
        textColor: 'black',
      },
      {
        platform: 'Discord',
        handle: 'discord.gg/akt',
        cta: 'Join',
        url: 'https://discord.gg/akt',
        icon: '/platform/discord.webp',
        buttonColor: '#5865F2',
      },
    ],
  },
]

export const LINK_SECTION_BY_ID: Record<SectionId, LinkSection> = LINK_SECTIONS.reduce(
  (acc, section) => {
    acc[section.id] = section
    return acc
  },
  {} as Record<SectionId, LinkSection>,
)
