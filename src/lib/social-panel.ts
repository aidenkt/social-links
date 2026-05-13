/**
 * Fixed shell for the social list (Tailwind must see full string in this file — see `tailwind.config.ts` content).
 * `h-[17rem]`: fits about 3× SocialAccount rows + padding; `shrink-0`: column flex must not squash this box.
 */
export const SOCIAL_PANEL_SHELL_CLASS =
  'h-[17rem] shrink-0 overflow-hidden rounded-xl border border-neutral-200/90 bg-neutral-50 p-2 shadow-sm max-sm:rounded-none max-sm:border-0 max-sm:bg-transparent max-sm:p-0 max-sm:shadow-none'
