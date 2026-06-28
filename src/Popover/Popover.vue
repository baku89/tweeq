<script lang="ts" setup>
import {unrefElement, useEventListener, useResizeObserver} from '@vueuse/core'
import {computed, ref, useTemplateRef, watch, watchEffect} from 'vue'

import {Balloon} from '../Balloon'
import {addAnchorName} from '../util'
import type {PopoverProps} from './types'

type ArrowSide = 'top' | 'bottom' | 'left' | 'right'

const props = withDefaults(defineProps<PopoverProps>(), {
	open: false,
	placement: 'bottom-start',
	lightDismiss: true,
	offset: 0,
})

const emit = defineEmits<{
	'update:open': [boolean]
	close: []
}>()

const $popover = useTemplateRef<HTMLElement>('$popover')

// CSS anchor name: the caller's fixed one, or a unique generated one. A plain
// counter is enough — this is a client-only app, so there's no SSR hydration to
// keep in sync.
const anchorName = props.anchorName ?? `--tq-popover-${instanceCount++}`

// CSS Anchor Positioning needs the name on the anchor element itself. When we
// generated the name, apply it to the reference ourselves (resolving a possible
// component instance first — TitleBar passes its <ColorIcon>, not a raw
// element) and clean up on change/unmount. When the caller supplied the name,
// they own setting it on the reference.
watchEffect(onCleanup => {
	if (props.anchorName) return
	const el = unrefElement(props.reference)
	if (!el) return
	onCleanup(addAnchorName(el, anchorName))
})

useEventListener('keydown', e => {
	// Esc is part of light-dismiss; a popover with lightDismiss off (a manual
	// popover) stays open until its controller closes it.
	if (e.key === 'Escape' && props.open && props.lightDismiss) {
		emit('close')
		emit('update:open', false)
	}
})

useEventListener($popover, 'toggle', e => {
	const {newState} = e as ToggleEvent
	if (newState === 'close') {
		emit('close')
	}
	emit('update:open', newState === 'open')
})

watch(
	() => [props.open, $popover.value] as const,
	([open, $popover]) => {
		if (!$popover) return
		$popover.togglePopover(open)
		if (open) {
			// Reset the shift so update() re-derives it from the natural position
			// for the new opening (the anchor/reference may have moved).
			shiftX.value = 0
			shiftY.value = 0
			// Resolve the arrow side/offset synchronously (forces a layout read on
			// the just-shown popover) so anything keyed off it — the Balloon's
			// transform-origin, e.g. its pop-in/flash scaling about the arrow — is
			// correct on the very first frame, not a frame late. The rAF pass then
			// settles any post-layout shift.
			update()
			requestAnimationFrame(update)
		}
	}
)

// Derive the Balloon arrow from where the popover actually landed (relative to
// the reference), so it follows flips. Recomputed after it opens and whenever
// the layout shifts.
const arrowSide = ref<ArrowSide>()
const arrowOffset = ref(0)

// Cross-axis shift (px) applied via `transform` to slide the popover back into
// the viewport. CSS `position-try-fallbacks` only flips; it never slides a
// centred popover in when the anchor sits near a viewport edge — so we do the
// floating-ui-style "shift" ourselves. Applied as `transform` (not the anchor
// insets), it stays invisible to position-try, so it can't fight the flip.
const shiftX = ref(0)
const shiftY = ref(0)

const shiftStyle = computed<Record<string, string>>(() =>
	shiftX.value || shiftY.value
		? {transform: `translate(${shiftX.value}px, ${shiftY.value}px)`}
		: {}
)

// Keep this much gap between the popover and the viewport edge when shifting.
const VIEWPORT_MARGIN = 8

function update() {
	const reference = unrefElement(props.reference)
	const popover = $popover.value
	// vec2 placements are manual coordinates (e.g. InputDropdown) — leave them be.
	if (!reference || !popover || typeof props.placement !== 'string') return

	const r = reference.getBoundingClientRect()
	const p = popover.getBoundingClientRect()

	const [side] = props.placement.split('-')
	const horizontal = side === 'top' || side === 'bottom'

	// Shift along the cross axis (x for top/bottom, y for left/right) so the box
	// stays within the viewport. Work from the *natural* position (measured rect
	// minus the shift already applied) so this converges instead of drifting
	// frame to frame.
	let dx = 0
	let dy = 0
	if (horizontal) {
		const left = p.left - shiftX.value
		const right = p.right - shiftX.value
		const vw = document.documentElement.clientWidth
		if (right > vw - VIEWPORT_MARGIN) dx = vw - VIEWPORT_MARGIN - right
		// If both edges overflow (popover wider than viewport) the left edge wins.
		if (left + dx < VIEWPORT_MARGIN) dx = VIEWPORT_MARGIN - left
	} else {
		const top = p.top - shiftY.value
		const bottom = p.bottom - shiftY.value
		const vh = document.documentElement.clientHeight
		if (bottom > vh - VIEWPORT_MARGIN) dy = vh - VIEWPORT_MARGIN - bottom
		if (top + dy < VIEWPORT_MARGIN) dy = VIEWPORT_MARGIN - top
	}
	shiftX.value = dx
	shiftY.value = dy

	if (!props.arrow) return

	// The final (post-shift) rect the arrow must point into.
	const fpLeft = p.left - shiftX.value + dx
	const fpTop = p.top - shiftY.value + dy
	const fp = {left: fpLeft, top: fpTop, right: fpLeft + p.width, bottom: fpTop + p.height}

	let arrow: ArrowSide
	if (fp.top >= r.bottom - 1) arrow = 'top'
	else if (fp.bottom <= r.top + 1) arrow = 'bottom'
	else if (fp.left >= r.right - 1) arrow = 'left'
	else arrow = 'right'

	arrowSide.value = arrow
	arrowOffset.value =
		arrow === 'top' || arrow === 'bottom'
			? r.left + r.width / 2 - fp.left
			: r.top + r.height / 2 - fp.top
}

// A shared tooltip popover keeps the same instance but swaps its reference, so
// recompute when the reference changes too.
watch(
	() => props.reference,
	() => {
		if (props.open) requestAnimationFrame(update)
	}
)

useEventListener('scroll', update, {capture: true, passive: true})
useEventListener('resize', update)
useResizeObserver($popover, update)

const offsetOption = computed(() => {
	const o = props.offset
	if (typeof o === 'number') return {mainAxis: o, crossAxis: 0}
	return {mainAxis: o.mainAxis ?? 0, crossAxis: o.crossAxis ?? 0}
})

// Map the placement (a floating-ui-style string, or a manual vec2) to inline
// styles. String placements use CSS Anchor Positioning: pin the facing edge to
// the opposite anchor edge via anchor(), align on the cross axis, and let
// position-try-fallbacks flip it into view. vec2 stays a plain fixed coordinate
// (e.g. InputDropdown overlaying the selected option on its input) and never
// touches anchoring.
const styles = computed<Record<string, string>>(() => {
	const placement = props.placement

	if (typeof placement !== 'string') {
		return {left: `${placement[0]}px`, top: `${placement[1]}px`}
	}

	const [side, align] = placement.split('-')
	const {mainAxis, crossAxis} = offsetOption.value
	const main = `${mainAxis}px`
	const cross = `${crossAxis}px`
	const horizontal = side === 'top' || side === 'bottom'
	const css: Record<string, string> = {
		positionAnchor: anchorName,
		positionTryFallbacks: 'flip-block, flip-inline, flip-block flip-inline',
	}

	// main axis: pin the facing edge to the opposite anchor edge, then push off
	// by the main-axis gap.
	if (side === 'top') {
		css.bottom = 'anchor(top)'
		css.marginBottom = main
	} else if (side === 'bottom') {
		css.top = 'anchor(bottom)'
		css.marginTop = main
	} else if (side === 'left') {
		css.right = 'anchor(left)'
		css.marginRight = main
	} else if (side === 'right') {
		css.left = 'anchor(right)'
		css.marginLeft = main
	}

	// cross axis: align to a start/end anchor edge (plus any nudge), or centre.
	if (align === 'start') {
		if (horizontal) {
			css.left = 'anchor(left)'
			css.marginLeft = cross
		} else {
			css.top = 'anchor(top)'
			css.marginTop = cross
		}
	} else if (align === 'end') {
		if (horizontal) {
			css.right = 'anchor(right)'
			css.marginRight = cross
		} else {
			css.bottom = 'anchor(bottom)'
			css.marginBottom = cross
		}
	} else if (horizontal) {
		css.left = 'anchor(center)'
		css.translate = '-50% 0'
	} else {
		css.top = 'anchor(center)'
		css.translate = '0 -50%'
	}

	return css
})
</script>

<script lang="ts">
let instanceCount = 0
</script>

<template>
	<Teleport :to="teleport" :disabled="!teleport">
		<div
			v-if="open || exitTransition"
			ref="$popover"
			class="Popover"
			:class="{'animate-exit': exitTransition}"
			:style="[styles, shiftStyle]"
			:popover="lightDismiss ? 'auto' : 'manual'"
		>
			<Balloon
				v-if="arrow"
				:arrow-side="arrowSide"
				:arrow-offset="arrowOffset"
				:flash="flash"
			>
				<slot />
			</Balloon>
			<slot v-else />
		</div>
	</Teleport>
</template>

<style lang="stylus" scoped>
// A transparent wrapper; consumers style their own box inside. Positioned with
// CSS Anchor Positioning (no JS library) — `inset: auto` clears the popover UA
// default so the anchor()/coordinate insets from `styles` take over. Fade the
// whole popup in on open (native popover → @starting-style); the exit is instant
// (display flips with no allow-discrete) to keep dismissal snappy.
.Popover
	position fixed
	inset auto
	background transparent
	overflow visible
	transition opacity var(--tq-active-transition-duration) ease-out

@starting-style
	.Popover:popover-open
		opacity 0

// Opt-in animated exit. The element stays mounted while closed (v-if keeps it),
// and `display ... allow-discrete` defers the display:none flip so the fade-out
// + the Balloon's scale-down can play first. Because the element is never
// re-created per open, the Balloon's own @starting-style won't re-fire — so the
// scale is driven here from the popover's :popover-open state instead.
.Popover.animate-exit
	opacity 0
	// `overlay allow-discrete` keeps the popover in the top layer for the whole
	// fade — without it hidePopover() drops it out of the top layer at once and it
	// vanishes instantly despite the opacity transition. `display allow-discrete`
	// likewise defers the display:none flip.
	transition opacity var(--tq-active-transition-duration) ease-out, display var(--tq-active-transition-duration) allow-discrete, overlay var(--tq-active-transition-duration) allow-discrete

	:deep(.TqBalloon)
		transform scale(0.96)

.Popover.animate-exit:popover-open
	opacity 1

	:deep(.TqBalloon)
		transform scale(1)

@starting-style
	.Popover.animate-exit:popover-open
		opacity 0

		:deep(.TqBalloon)
			transform scale(0.96)
</style>
