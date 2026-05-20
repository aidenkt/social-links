'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

export default function SectionPageTracker({ section }: { section: string }) {
  useEffect(() => {
    posthog.capture('section_page_viewed', { section })
  }, [section])

  return null
}
