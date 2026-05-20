import posthog from 'posthog-js'

type AnalyticsProperties = Record<string, string | number | boolean | undefined>

type CaptureOptions = {
  /** Flush immediately instead of waiting for the batch queue (recommended for all custom events). */
  sendInstantly?: boolean
  transport?: 'XHR' | 'fetch' | 'sendBeacon'
}

function cleanProperties(properties?: AnalyticsProperties): Record<string, string | number | boolean> | undefined {
  if (!properties) return undefined
  const out: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined && value !== null) out[key] = value
  }
  return Object.keys(out).length > 0 ? out : undefined
}

/** Capture a custom PostHog event (pageviews are handled automatically by the SDK). */
export function captureEvent(
  event: string,
  properties?: AnalyticsProperties,
  options: CaptureOptions = {}
): void {
  if (typeof window === 'undefined') return

  posthog.capture(event, cleanProperties(properties), {
    send_instantly: options.sendInstantly ?? true,
    ...(options.transport ? { transport: options.transport } : {}),
  })
}
