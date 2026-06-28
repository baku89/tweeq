import {reactive, shallowRef} from 'vue'

import {addAnchorName} from '../util'

// Shared state for the single, app-wide tooltip. The vTooltip directive feeds it
// and TooltipRoot renders from it (one popover reused across every tooltip).
//
// The reference element lives in a shallowRef rather than inside the reactive
// object so its HTMLElement type isn't deeply unwrapped (which expands into a
// huge structural type that no longer matches `HTMLElement`).
export const tooltipReference = shallowRef<HTMLElement | null>(null)

// Fixed CSS anchor name for the single tooltip. The directive puts it on the
// hovered element (on enter, before the show delay) so CSS anchor() is already
// resolved by the time the popover appears.
export const TOOLTIP_ANCHOR_NAME = '--tq-tooltip'

// Exactly one element carries the anchor name at a time. We move it on enter
// rather than clearing on leave: clearing on leave would strip the anchor while
// the popover is still closing (hide is async), flashing it to an unanchored
// corner. Leaving it until the next element takes over keeps the popover
// anchored through its close.
let anchoredEl: HTMLElement | null = null
let removeAnchorName: (() => void) | null = null

export function setTooltipAnchor(el: HTMLElement) {
	if (anchoredEl === el) return
	removeAnchorName?.()
	removeAnchorName = addAnchorName(el, TOOLTIP_ANCHOR_NAME)
	anchoredEl = el
}

export function clearTooltipAnchor(el: HTMLElement) {
	if (anchoredEl === el) {
		removeAnchorName?.()
		removeAnchorName = null
		anchoredEl = null
	}
}

/**
 * The renderable payload for one tooltip. `title`/`description` drive the
 * structured two-line layout (bold title + muted description); `content` is the
 * single-blob form (plain text, or rich markup when `html` is set). A value can
 * mix them, but in practice it's either title/description or content.
 */
export interface TooltipContent {
	content: string
	html: boolean
	title: string
	description: string
}

interface TooltipState extends TooltipContent {
	open: boolean
}

export const tooltipState = reactive<TooltipState>({
	content: '',
	html: false,
	title: '',
	description: '',
	open: false,
})

const SHOW_DELAY = 200
const HIDE_DELAY = 0

let showTimer: ReturnType<typeof setTimeout> | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined

export function showTooltip(reference: HTMLElement, content: TooltipContent) {
	clearTimeout(hideTimer)
	clearTimeout(showTimer)

	const apply = () => {
		tooltipReference.value = reference
		Object.assign(tooltipState, content)
		tooltipState.open = true
	}

	// Hand off instantly when moving straight from one tooltipped element to
	// another; otherwise wait out the hover delay. The anchor-name is already on
	// the element (the directive set it on enter), so no first-frame race.
	if (tooltipState.open) apply()
	else showTimer = setTimeout(apply, SHOW_DELAY)
}

export function hideTooltip(reference: HTMLElement) {
	clearTimeout(showTimer)
	clearTimeout(hideTimer)
	hideTimer = setTimeout(() => {
		if (tooltipReference.value === reference) {
			tooltipState.open = false
		}
	}, HIDE_DELAY)
}

// Live-update the text while this element's tooltip is showing (e.g. a status
// string that changes).
export function updateTooltip(
	reference: HTMLElement,
	content: TooltipContent
) {
	if (tooltipState.open && tooltipReference.value === reference) {
		Object.assign(tooltipState, content)
	}
}

// Drop the tooltip at once if this element owns it (e.g. it's being unmounted).
export function closeTooltip(reference: HTMLElement) {
	clearTimeout(showTimer)
	if (tooltipReference.value === reference) {
		clearTimeout(hideTimer)
		tooltipState.open = false
	}
}
