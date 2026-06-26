<script setup lang="ts">
import {onBeforeUnmount, onMounted, useTemplateRef} from 'vue'

// Renders a drag-to-tweak overlay in the browser top layer (via a manual
// popover) so it escapes any ancestor that establishes a containing block for
// position:fixed. A `transform` or `backdrop-filter` on a surrounding pane /
// modal would otherwise re-anchor the full-screen overlay to that box (and
// effectively hide it). Top-layer elements are laid out against the viewport and
// painted above everything, regardless of such ancestors — so wrapping an
// input's `.overlay` in this makes it show correctly inside any pane.

const $root = useTemplateRef<HTMLElement>('$root')

onMounted(() => {
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
		<slot />
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
</style>
