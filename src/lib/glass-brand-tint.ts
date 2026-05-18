const CLEAR_DELAY_MS = 80

const clearTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>()

function updatePanelTint(panel: HTMLElement, row: HTMLElement, brandColor: string) {
  panel.style.setProperty('--panel-brand-color', brandColor)

  const cta = row.querySelector('a')
  if (!cta) return

  const panelRect = panel.getBoundingClientRect()
  const ctaRect = cta.getBoundingClientRect()
  const x = ((ctaRect.left + ctaRect.width / 2 - panelRect.left) / panelRect.width) * 100
  const y = ((ctaRect.top + ctaRect.height / 2 - panelRect.top) / panelRect.height) * 100
  panel.style.setProperty('--brand-tint-x', `${x}%`)
  panel.style.setProperty('--brand-tint-y', `${y}%`)
}

function clearPanelTint(panel: HTMLElement) {
  panel.removeAttribute('data-brand-tint')
  panel.style.removeProperty('--panel-brand-color')
  panel.style.removeProperty('--brand-tint-x')
  panel.style.removeProperty('--brand-tint-y')
}

function cancelPendingClear(panel: HTMLElement) {
  const timer = clearTimers.get(panel)
  if (timer === undefined) return
  clearTimeout(timer)
  clearTimers.delete(panel)
}

/** Drive full-panel glass tint from a hovered/focused social row. */
export function setGlassPanelBrandTint(row: HTMLElement, brandColor: string, active: boolean) {
  const panel = row.closest('.glass-panel')
  if (!panel || !(panel instanceof HTMLElement)) return

  if (active) {
    cancelPendingClear(panel)
    updatePanelTint(panel, row, brandColor)
    panel.setAttribute('data-brand-tint', '')
    return
  }

  const stillActive = panel.querySelector('.social-row:hover, .social-row:focus-within')
  if (stillActive) return

  cancelPendingClear(panel)
  clearTimers.set(
    panel,
    setTimeout(() => {
      clearTimers.delete(panel)
      if (panel.querySelector('.social-row:hover, .social-row:focus-within')) return
      clearPanelTint(panel)
    }, CLEAR_DELAY_MS),
  )
}

/** Skip deactivate when the pointer moves directly to another row in the same panel. */
export function isMovingToSiblingSocialRow(
  row: HTMLElement,
  relatedTarget: EventTarget | null,
): boolean {
  if (!(relatedTarget instanceof Node)) return false

  const panel = row.closest('.glass-panel')
  if (!panel?.contains(relatedTarget)) return false

  const relatedEl = relatedTarget instanceof HTMLElement ? relatedTarget : relatedTarget.parentElement
  return Boolean(relatedEl?.closest('.social-row'))
}
