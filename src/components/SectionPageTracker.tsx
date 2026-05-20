'use client'

import { useEffect } from 'react'
import { captureEvent } from '../lib/posthog-capture'

export default function SectionPageTracker({ section }: { section: string }) {
  useEffect(() => {
    captureEvent('section_page_viewed', { section })
  }, [section])

  return null
}
