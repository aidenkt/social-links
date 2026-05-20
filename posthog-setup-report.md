<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Aiden's social links landing page. The integration includes client-side initialization via `instrumentation-client.ts`, a reverse proxy through Next.js rewrites, error tracking via `capture_exceptions`, and event tracking across four key user interaction points. No existing code (Vercel Analytics, component architecture) was altered — PostHog calls are additive alongside the existing implementation.

## Changes made

| File | Change |
|------|--------|
| `instrumentation-client.ts` | Created — PostHog client-side init with reverse proxy, exception capture, and debug mode |
| `next.config.js` | Added `/ingest/*` rewrites to route PostHog traffic through the app (reverse proxy) |
| `src/components/TrackedOutboundLink.tsx` | Added `posthog.capture('outbound_link_clicked', {...})` alongside existing Vercel `track` |
| `src/components/SectionPicker.tsx` | Added `posthog.capture` for `section_changed` (desktop tabs + mobile menu) and `section_dropdown_toggled` (mobile dropdown) |
| `src/components/SectionPageTracker.tsx` | Created — lightweight client component that fires `section_page_viewed` on mount |
| `src/app/[section]/page.tsx` | Added `<SectionPageTracker>` to track direct section URL landings |
| `.env.local` | Added `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` |

## Events tracked

| Event | Description | File |
|-------|-------------|------|
| `outbound_link_clicked` | User clicked an outbound link (social platform, email, footer, etc.) — includes `href`, `destination`, `label`, `source` properties | `src/components/TrackedOutboundLink.tsx` |
| `section_changed` | User switched to a different social section via desktop tabs or mobile dropdown — includes `section` and `previous_section` | `src/components/SectionPicker.tsx` |
| `section_dropdown_toggled` | User opened or closed the mobile section picker dropdown — includes `open` (boolean) | `src/components/SectionPicker.tsx` |
| `section_page_viewed` | User landed on a direct section URL (e.g. `/instagram`) — top of conversion funnel — includes `section` | `src/components/SectionPageTracker.tsx` |

## Next steps

We've built a dashboard and five insights to keep an eye on user behavior:

- [Analytics basics dashboard](https://us.posthog.com/project/432406/dashboard/1607516)
- [Outbound link clicks over time](https://us.posthog.com/project/432406/insights/bv2lRPyl)
- [Top social platforms clicked](https://us.posthog.com/project/432406/insights/PjSvUHJA)
- [Section engagement](https://us.posthog.com/project/432406/insights/Q6E9iTiv)
- [Section page → link click funnel](https://us.posthog.com/project/432406/insights/zwSMP30h)
- [Unique daily visitors (link clickers)](https://us.posthog.com/project/432406/insights/s3ykj3QC)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
