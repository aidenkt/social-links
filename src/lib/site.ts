import type { Metadata } from 'next'
import { STATIC_SECTION_PATHS } from './sections'

export const PERSON_NAME = 'Aiden Tabrizi'
export const PERSON_ALIAS = 'AidenKT'
export const PERSON_ALIASES = ['AidenKT', 'aidenkt', 'akt', 'Aiden K Tabrizi'] as const
export const CANONICAL_SITE_URL = 'https://aiden.social'

const SITE_TITLE = `${PERSON_NAME} (${PERSON_ALIAS}) — Social Links`
const SITE_DESCRIPTION =
  'Official social links for Aiden Tabrizi (also known as AidenKT, aidenkt, akt, and Aiden K Tabrizi): Instagram, YouTube, TikTok, LinkedIn, GitHub, Spotify, and more — all in one place.'

/** Handles used across platforms — helps search engines associate this page with name queries. */
export const PERSON_KEYWORDS = [
  PERSON_NAME,
  ...PERSON_ALIASES,
  '@aidenkt',
  '@aidentabrizi',
  'Aiden Tabrizi socials',
  'AidenKT socials',
  'Aiden Tabrizi links',
  'AidenKT links',
  'link in bio',
]

export const PERSON_SAME_AS = [
  CANONICAL_SITE_URL,
  'https://instagram.com/aidentabrizi',
  'https://twitter.com/aiden_kt',
  'https://www.youtube.com/@aidenkt',
  'https://www.tiktok.com/@aidenkt',
  'https://www.linkedin.com/in/aidenkt/',
  'https://github.com/AidenKT',
  'https://medium.com/@aidenkt',
  'https://bsky.app/profile/aiden.social',
  'https://www.threads.net/@aidentabrizi',
] as const

const SECTION_LABELS: Record<string, string> = {
  main: 'Main',
  text: 'Text',
  photos: 'Photos',
  videos: 'Videos',
  playlists: 'Playlists',
  audio: 'Playlists',
  music: 'Playlists',
  a: 'Playlists',
  work: 'Work',
  dev: 'Work',
  w: 'Work',
  contact: 'Contact',
}

export function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return new URL(explicit.endsWith('/') ? explicit : `${explicit}/`)

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (production) return new URL(`https://${production}/`)

  const preview = process.env.VERCEL_URL?.trim()
  if (preview) return new URL(`https://${preview}/`)

  return new URL(`${CANONICAL_SITE_URL}/`)
}

export function getSectionLabel(section: string): string | undefined {
  return SECTION_LABELS[section.toLowerCase()]
}

export function buildPageMetadata(pathname = ''): Metadata {
  const siteUrl = getSiteUrl()
  const canonicalPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  const canonical = new URL(canonicalPath, siteUrl)
  const sectionSlug = canonicalPath.replace(/^\//, '')
  const sectionLabel = sectionSlug ? getSectionLabel(sectionSlug) : undefined

  const title = sectionLabel
    ? `${sectionLabel} — ${PERSON_NAME} (${PERSON_ALIAS})`
    : SITE_TITLE

  const description = sectionLabel
    ? `${sectionLabel} profiles and links for ${PERSON_NAME} (AidenKT) — Instagram, YouTube, LinkedIn, GitHub, and more.`
    : SITE_DESCRIPTION

  const ogImage = new URL('/favicon.png', siteUrl)

  return {
    metadataBase: siteUrl,
    title: {
      default: SITE_TITLE,
      template: `%s | ${PERSON_NAME} (${PERSON_ALIAS})`,
    },
    description,
    keywords: [...PERSON_KEYWORDS],
    applicationName: `${PERSON_ALIAS} Social Links`,
    authors: [{ name: PERSON_NAME, url: siteUrl }],
    creator: PERSON_NAME,
    publisher: PERSON_NAME,
    category: 'social',
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'profile',
      locale: 'en_US',
      url: canonical,
      siteName: `${PERSON_NAME} (${PERSON_ALIAS})`,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 512,
          height: 512,
          alt: `${PERSON_NAME} (AidenKT) profile`,
        },
      ],
      firstName: 'Aiden',
      lastName: 'Tabrizi',
      username: PERSON_ALIAS,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [ogImage],
    },
    icons: {
      icon: '/favicon.png',
      shortcut: '/favicon.png',
      apple: '/favicon.png',
    },
    other: {
      'profile:username': PERSON_ALIAS,
    },
  }
}

export function buildPersonJsonLd(pathname = '') {
  const siteUrl = getSiteUrl()
  const pageUrl = new URL(pathname.startsWith('/') ? pathname : `/${pathname}`, siteUrl)

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl.origin}/#website`,
        url: siteUrl.origin,
        name: SITE_TITLE,
        description: SITE_DESCRIPTION,
        inLanguage: 'en-US',
        publisher: { '@id': `${siteUrl.origin}/#person` },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${pageUrl.href}#webpage`,
        url: pageUrl.href,
        name: SITE_TITLE,
        description: SITE_DESCRIPTION,
        isPartOf: { '@id': `${siteUrl.origin}/#website` },
        about: { '@id': `${siteUrl.origin}/#person` },
        inLanguage: 'en-US',
      },
      {
        '@type': 'Person',
        '@id': `${siteUrl.origin}/#person`,
        name: PERSON_NAME,
        alternateName: [...PERSON_ALIASES, '@aidenkt', '@aidentabrizi'],
        url: siteUrl.origin,
        email: 'hi@aidenkt.com',
        sameAs: [...PERSON_SAME_AS],
      },
    ],
  }
}

export function getSitemapPaths(): string[] {
  return ['', ...STATIC_SECTION_PATHS.map((section) => `/${section}`)]
}
