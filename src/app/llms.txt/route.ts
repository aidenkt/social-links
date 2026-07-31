import { LINK_SECTIONS } from '../../lib/links'
import {
  CANONICAL_SITE_URL,
  PERSON_ALIAS,
  PERSON_ALIASES,
  PERSON_NAME,
  getSiteUrl,
} from '../../lib/site'

/**
 * Serves /llms.txt — a concise, machine-readable map of this site for AI
 * agents and LLM crawlers (see https://llmstxt.org). Generated from the same
 * link data the UI renders, so it can never drift from what humans see.
 */
export const dynamic = 'force-static'

export function GET(): Response {
  const siteUrl = getSiteUrl()
  const home = siteUrl.href

  const lines: string[] = []

  lines.push(`# ${PERSON_NAME} (${PERSON_ALIAS})`)
  lines.push('')
  lines.push(
    `> Official link-in-bio hub for ${PERSON_NAME} (also known as ${PERSON_ALIASES.join(', ')}). ` +
      'Every social profile, music account, work profile, and contact method in one place.',
  )
  lines.push('')
  lines.push(`- Name: ${PERSON_NAME}`)
  lines.push(`- Also known as: ${PERSON_ALIASES.join(', ')}`)
  lines.push(`- This page (social links): ${home}`)
  lines.push(`- Canonical website: ${CANONICAL_SITE_URL}`)
  lines.push('')
  lines.push(
    'Links are grouped into sections. Each section is also directly reachable, ' +
      `e.g. ${home}main or ${home}contact.`,
  )
  lines.push('')

  for (const section of LINK_SECTIONS) {
    lines.push(`## ${section.label}`)
    const sectionUrl = new URL(section.id, siteUrl).href
    lines.push(`Section page: ${sectionUrl}`)
    lines.push('')
    for (const link of section.links) {
      lines.push(`- [${link.platform} — ${link.handle}](${link.url})`)
    }
    lines.push('')
  }

  const body = lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
