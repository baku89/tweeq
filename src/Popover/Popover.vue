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
	if (e.key === 'Escape' && props.open) {
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
		if (open) requestAnimationFrame(updateArrow)
	}
)

// Derive the Balloon arrow from where the popover actually landed (relative to
// the reference), so it follows flips. Recomputed after it opens and whenever
// the layout shifts.
const arrowSide = ref<ArrowSide>()
const arrowOffset = ref(0)

function updateArrow() {
	if (!props.arrow) return
	const reference = unrefElement(props.reference)
	const popover = $popover.value
	if (!reference || !popover) return

	const r = reference.getBoundingClientRect()
	const p = popover.getBoundingClientRect()

	let side: ArrowSide
	if (p.top >= r.bottom - 1) side = 'top'
	else if (p.bottom <= r.top + 1) side = 'bottom'
	else if (p.left >= r.right - 1) side = 'left'
	else side = 'right'

	arrowSide.value = side
	arrowOffset.value =
		side === 'top' || side === 'bottom'
			? r.left + r.width / 2 - p.left
			: r.top + r.height / 2 - p.top
}

// A shared tooltip popover keeps the same instance but swaps its reference, so
// recompute the arrow when the reference changes too.
watch(
	() => props.reference,
	() => {
		if (props.open) requestAnimationFrame(updateArrow)
	}
)

useEventListener('scroll', updateArrow, {capture: true, passive: true})
useEventListener('resize', updateArrow)
useResizeObserver($popover, updateArrow)

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
			:style="styles"
			:popover="lightDismiss ? 'auto' : 'manual'"
		>
			<Balloon v-if="arrow" :arrow-side="arrowSide" :arrow-offset="arrowOffset">
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
