<script lang="ts" setup>
import {Icon} from '../Icon'
import type {InputButtonProps} from './types'

defineProps<InputButtonProps>()
</script>

<template>
	<!--
		@mousedown.prevent stops a mouse click from focusing the button (the click
		still fires). Otherwise the button keeps focus after a click and a later
		Enter/Space re-activates it unexpectedly. Keyboard (Tab) focus is
		unaffected, so keyboard activation still works — matching :focus-visible.
	-->
	<button
		class="TqInputButton"
		:class="{blink, subtle}"
		:inline-position="inlinePosition"
		:block-position="blockPosition"
		:disabled="disabled"
		@mousedown.prevent
	>
		<Icon v-if="icon" class="icon" :icon="icon" />
		<span v-if="label" class="label">{{ label }}</span>
	</button>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqInputButton
	position relative
	height var(--tq-input-height)
	min-width var(--tq-input-height)
	border-radius var(--tq-radius-input)
	background var(--tq-color-accent)
	color var(--tq-color-on-accent)
	display flex
	align-items center
	justify-content center
	hover-transition(background, color)
	gap .2em
	--bg var(--tq-color-accent)
	--bg-blink var(--tq-color-accent-hover)

	// Default button is accent-filled: an inner ring in the off-state button
	// color (input) sits on the fill, plus an accent ring just OUTSIDE that reads
	// against it at the edge. The subtle variant (input bg) below restores the
	// plain outside accent ring.
	--focus-ring inset 0 0 0 1px var(--tq-color-input), 0 0 0 1px var(--tq-color-accent)

	use-input-position()

	&:focus-visible
		fill-focus-style()

	&:not(:disabled):hover
		background var(--tq-color-accent-hover)

	// Disabled: dim and inert. animation:none stops blink; hover is gated above.
	&:disabled
		opacity .4
		cursor not-allowed
		animation none

	&:has(.label):not(:has(.icon))
		padding 0 .75em

	&:has(.icon):has(.label)
		padding 0 .75em 0 0.5em

	.icon
		display block

	.label
		line-height var(--tq-input-height)

	// Styles
	&.subtle
		background var(--tq-color-input)
		--bg var(--tq-color-input)
		--bg-blink var(--tq-color-input-hover)
		--focus-ring 0 0 0 1px var(--tq-color-accent)

		&:not(:hover)
			color var(--tq-color-text)

		&:not(:disabled):hover
			background var(--tq-color-accent-hover)

	&.blink
		animation blink .5s infinite
		animation-direction alternate

	@keyframes blink
		0%
			background var(--bg)
		100%
			background var(--bg-blink)
</style>
