<script setup lang="ts">
import {useEventListener} from '@vueuse/core'
import {ref, useTemplateRef, watchEffect} from 'vue'

defineSlots<{
	default: void
}>()

const props = withDefaults(
	defineProps<{
		open: boolean
	}>(),
	{
		open: false,
	}
)

const $root = useTemplateRef('$root')

watchEffect(() => {
	$root.value?.togglePopover(props.open)
})

// The modal is `popover="manual"`, so it never light-dismisses: closing is up to
// the slotted Save/Cancel buttons. A pointerdown outside bounces the modal to
// signal that it's modal rather than silently doing nothing.
const emphasize = ref(false)

useEventListener('pointerdown', e => {
	if (!props.open) return
	const root = $root.value
	if (!root || e.composedPath().includes(root)) return

	// Restart the animation even on rapid repeated clicks.
	emphasize.value = false
	requestAnimationFrame(() => (emphasize.value = true))
})
</script>

<template>
	<div
		ref="$root"
		class="TqPaneModal"
		:class="{emphasize}"
		popover="manual"
		@animationend="emphasize = false"
	>
		<slot />
	</div>
</template>

<!--
	The popover is promoted to the top layer and rendered outside .TqViewport,
	so it misses Tweeq's viewport reset (font-family, etc.) and falls back to
	the UA serif font. Apply the reset here, unscoped so it also reaches slotted
	content — same approach as MultiSelectPopup.
-->
<style lang="stylus">
@import '../common.styl'

reset-viewport('.TqPaneModal')
</style>

<style scoped lang="stylus">
@import '../common.styl'

.TqPaneModal
	popup-style()
	inset 0
	margin auto
	padding var(--tq-pane-padding)
	// Never let tall content spill past the viewport without a way to reach it.
	// Cap to the viewport minus a gutter (so a full-height modal still keeps a
	// margin from the screen edges — margin:auto splits the slack evenly) and
	// let the slotted content own its own scrolling.
	max-height calc(100dvh - 2 * var(--tq-pane-margin))
	max-width calc(100dvw - 2 * var(--tq-pane-margin))
	overflow hidden
	display flex
	flex-direction column
	transition opacity var(-tq-transition-duration), transform var(-tq-transition-duration), overlay var(-tq-transition-duration) allow-discrete, display var(-tq-transition-duration) allow-discrete
	opacity 0
	transform translateY(calc(var(--tq-rem) / -2))

	&[popover]::backdrop
		backdrop-filter blur(0px)
		transition backdrop-filter var(-tq-transition-duration)

	&:popover-open
		opacity 1
		transform translateY(0)

		&::backdrop
			backdrop-filter blur(4px)

		@starting-style
			&
				transform translateY(calc(var(--tq-rem) / -2))
				opacity 0

			&::backdrop
				backdrop-filter blur(0px)

	// Bounce when the user clicks outside, signalling the modal won't dismiss.
	&.emphasize
		animation modal-emphasize 0.2s ease

@keyframes modal-emphasize
	0%
		transform scale(1)
	35%
		transform scale(1.03)
	100%
		transform scale(1)
</style>
