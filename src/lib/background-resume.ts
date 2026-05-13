/** Dispatched from BackgroundRoot on `pageshow` (BFCache or history) before the dynamic Background chunk may load. */
export const SOCIAL_LINKS_BACKGROUND_RESUME = 'social-links:background-resume'

export const BFCACHE_PENDING_KEY = 'social-links:bfcache-pending-resume'

/** Call from `pageshow` when `event.persisted` so a late-loading dynamic Background can still resume. */
export function setPendingBfcacheResume(): void {
  try {
    sessionStorage.setItem(BFCACHE_PENDING_KEY, '1')
  } catch {
    /* noop */
  }
}

export function consumePendingBfcacheResume(): boolean {
  try {
    if (sessionStorage.getItem(BFCACHE_PENDING_KEY) !== '1') return false
    sessionStorage.removeItem(BFCACHE_PENDING_KEY)
    return true
  } catch {
    return false
  }
}

export function shouldResumeBackgroundNavigation(): boolean {
  if (typeof performance === 'undefined') return false
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  return nav?.type === 'back_forward'
}

export function dispatchBackgroundResume(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SOCIAL_LINKS_BACKGROUND_RESUME))
}
