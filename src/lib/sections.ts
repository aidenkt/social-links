export type SectionId =
  | 'primary'
  | 'text'
  | 'photos'
  | 'videos'
  | 'playlists'
  | 'work'
  | 'contact'

const SECTION_ALIASES: Record<string, SectionId> = {
  primary: 'primary',
  text: 'text',
  photos: 'photos',
  videos: 'videos',
  playlists: 'playlists',
  audio: 'playlists',
  music: 'playlists',
  a: 'playlists',
  work: 'work',
  dev: 'work',
  w: 'work',
  contact: 'contact',
}

export function normalizeSectionParam(value: string | null | undefined): SectionId | null {
  if (!value) return null
  return SECTION_ALIASES[value.toLowerCase()] ?? null
}

export const STATIC_SECTION_PATHS = Object.keys(SECTION_ALIASES)
