import { CANONICAL_SITE_URL, PERSON_NAME } from './site'

/**
 * Aiden's identity on aiden.social: the name, handle and picture this page already shows
 * (the `PERSON_*` constants in `site.ts` and `/favicon.png`, which is also the page's
 * profile image in its Open Graph data). It can differ from his KT Account; after each
 * sign-in it is reported to KT Accounts so Connected Apps shows "… on aiden.social".
 *
 * Shared by the server (identity report) and the owner corner (the card).
 */
export const OWNER_PROFILE = {
  displayName: PERSON_NAME,
  /** No "@"; KT Accounts accepts [A-Za-z0-9_.-]{1,40}. */
  handle: 'aidenkt',
  /** Same-origin path, shown in the corner. The KT copy is `auth/owner-picture.ts`. */
  picture: '/favicon.png',
  profileUrl: `${CANONICAL_SITE_URL}/`,
} as const
