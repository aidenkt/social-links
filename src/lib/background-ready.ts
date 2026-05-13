/** Fired on `document` / `window` when enough background floaters have loaded. */
export const BACKGROUND_READY_EVENT = 'social-links:background-ready'

/** Mirrored on `<html>` so late-mounted UI can sync without missing the event. */
export const BACKGROUND_READY_ATTR = 'data-social-links-background-ready'
