'use client'

import { useLayoutEffect } from 'react'
import Background from './Background'
import {
  dispatchBackgroundResume,
  setPendingBfcacheResume,
  shouldResumeBackgroundNavigation,
} from '../lib/background-resume'

export default function BackgroundRoot() {
  useLayoutEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      if (e.persisted) {
        setPendingBfcacheResume()
      }
      if (e.persisted || nav?.type === 'back_forward') {
        dispatchBackgroundResume()
      }
    }
    window.addEventListener('pageshow', onPageShow)
    if (shouldResumeBackgroundNavigation()) {
      dispatchBackgroundResume()
    }
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  return <Background />
}
