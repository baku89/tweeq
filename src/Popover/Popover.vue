<script lang="ts" setup>
import {unrefElement, useEventListener} from '@vueuse/core'
import {computed, useTemplateRef, watch, watchEffect} from 'vue'

import type {PopoverProps} from './types'

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

// Unique CSS anchor name for this instance. A plain counter is enough — this is
// a client-only app, so there's no SSR hydration to keep in sync.
const anchorName = `--tq-popover-${instanceCount++}`

// CSS Anchor Positioning needs the name on the anchor element itself. Resolve
// the reference to a real element first — callers may pass a component instance
// (e.g. TitleBar passes its <ColorIcon>), not a raw HTMLElement. Clean up when
// the reference changes or we unmount.
watchEffect(onCleanup => {
	const el = unrefElement(props.reference)
	if (!el) return
	el.style.setProperty('anchor-name', anchorName)
	onCleanup(() => el.style.removeProperty('anchor-name'))
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
	}
)

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
	<div
		v-if="open"
		ref="$popover"
		class="Popover"
		:style="styles"
		:popover="lightDismiss ? 'auto' : 'manual'"
	>
		<slot />
	</div>
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
</style>
