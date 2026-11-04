<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, useTemplateRef} from 'vue'

import {inwardOffset} from './inwardOffset'

// Renders a drag-to-tweak overlay in the browser top layer (via a manual
// popover) so it escapes any ancestor that establishes a containing block for
// position:fixed. A `transform` or `backdrop-filter` on a surrounding pane /
// modal would otherwise re-anchor the full-screen overlay to that box (and
// effectively hide it). Top-layer elements are laid out against the viewport and
// painted above everything, regardless of such ancestors — so wrapping an
// input's `.overlay` in this makes it show correctly inside any pane.

const props = defineProps<{
	/**
	 * Where the overlay is centered on the screen and how far around that has to
	 * stay in view, for it to slide inward near an edge. It may still stick out
	 * past that. What is inside moves as one, so it stays where it is to itself.
	 */
	keepInView?: {center: readonly [number, number]; reach: number}
}>()

const $root = useTemplateRef<HTMLElement>('$root')

// Once, on opening, so that it holds still under the drag.
const offset = ref<readonly [number, number]>([0, 0])

const shiftStyle = computed(() => ({
	'--shift': `${offset.value[0]}px ${offset.value[1]}px`,
}))

onMounted(() => {
	if (props.keepInView) {
		const {clientWidth, clientHeight} = document.documentElement
		offset.value = inwardOffset(props.keepInView.center, props.keepInView.reach, [
			clientWidth,
			clientHeight,
		])
	}
	try {
		$root.value?.showPopover()
	} catch {
		// Popover unsupported / already shown — the overlay still renders in place.
	}
})

onBeforeUnmount(() => {
	try {
		$root.value?.hidePopover()
	} catch {
		// already hidden or detached
	}
})
</script>

<template>
	<div ref="$root" class="TqTweakOverlay" popover="manual">
		<div v-if="keepInView" class="shift" :style="shiftStyle">
			<slot />
		</div>
		<slot v-else />
	</div>
</template>

<style scoped lang="stylus">
.TqTweakOverlay
	// Reset the UA popover box to a transparent, click-through full-viewport
	// layer. Crucially uses no transform / backdrop-filter / filter / contain, so
	// it doesn't itself become a containing block for the fixed overlay inside.
	position fixed
	inset 0
	width 100vw
	height 100vh
	margin 0
	padding 0
	border 0
	background transparent
	overflow visible
	pointer-events none

// As large as the viewport, so that the fixed overlay inside lands where it would
// without this, plus the shift. It slides there from the button.
.shift
	position fixed
	inset 0
	translate var(--shift)
	transition translate var(--tq-active-transition-duration) cubic-bezier(0.4, 0, 0.2, 1)

@starting-style
	.shift
		translate 0 0
</style>
