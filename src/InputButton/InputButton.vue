<script lang="ts" setup>
import {Icon} from '../Icon'
import {vTooltip} from '../Tooltip'
import {useFlash} from '../use/useFlash'
import type {InputButtonProps} from './types'

defineProps<InputButtonProps>()

// Imperative attention flash: a parent grabs this button via a template ref and
// calls `.flash()` to pulse it (e.g. to point the eye at the next action).
const {flashing, flash} = useFlash()

defineExpose({flash})

// The template root is a single <button> (no sibling comment node) so the
// component's $el resolves to the button itself — parents anchor popovers and
// move focus through it.
//
// @mousedown.prevent stops a mouse click from focusing the button (the click
// still fires). Otherwise the button keeps focus after a click and a later
// Enter/Space re-activates it unexpectedly. Keyboard (Tab) focus is unaffected,
// so keyboard activation still works — matching :focus-visible.
</script>

<template>
	<button
		class="TqInputButton"
		:class="{blink, subtle, narrow, flashing}"
		:inline-position="inlinePosition"
		:block-position="blockPosition"
		:disabled="disabled"
		v-tooltip="tooltip"
		@mousedown.prevent
	>
		<Icon v-if="icon" class="icon left" :icon="icon" />
		<span v-if="label" class="label">{{ label }}</span>
		<Icon v-if="rightIcon" class="icon right" :icon="rightIcon" />
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
	gap var(--tq-gap-related)
	--bg var(--tq-color-accent)
	--bg-blink var(--tq-color-accent-hover)

	// Default button is accent-filled: an inner ring in the off-state button
	// color (input) sits on the fill, plus an accent ring just OUTSIDE that reads
	// against it at the edge. The subtle variant (neutral bg) below restores the
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

	// Leading icon + label (no trailing icon): tighter on the icon side.
	&:has(.icon.left):has(.label):not(:has(.icon.right))
		padding 0 .75em 0 0.5em

	// Spread layout: a label with a trailing icon (e.g. a dropdown chevron, with
	// or without a leading icon). The label grows and left-aligns so the trailing
	// icon pins to the right edge — like a dropdown trigger.
	&:has(.icon.right):has(.label)
		justify-content flex-start
		padding 0 .5em

		.label
			flex 1
			text-align left
			overflow hidden
			text-overflow ellipsis
			white-space nowrap

	// Narrow: shed the square min-width down to a hair of horizontal padding so an
	// icon-only button nearly hugs its glyph (height is unchanged, so it still
	// lines up in an InputGroup). A label keeps its own wider padding, so this
	// only ever slims the icon-only case.
	&.narrow
		min-width 0
		padding-inline 1px

	.icon
		display block

	// The button is one line tall: a label never wraps, it sets the minimum width.
	.label
		line-height var(--tq-input-height)
		white-space nowrap

	// Styles
	// Subtle: an achromatic neutral fill at rest (more present than the
	// input/checkbox-off tone) that lights up to accent on hover.
	&.subtle
		background var(--tq-color-neutral)
		--bg var(--tq-color-neutral)
		--bg-blink var(--tq-color-neutral-hover)
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

	// Attention flash (imperative .flash()): a couple of accent-glow + faint-scale
	// pulses. relative z-index keeps the glow above neighbours in an InputGroup.
	&.flashing
		position relative
		z-index 1
		animation tq-input-button-flash .6s ease-in-out 2

	@keyframes tq-input-button-flash
		0%, 100%
			box-shadow 0 0 0 0 transparent
			transform scale(1)
		50%
			box-shadow 0 0 0 2px var(--tq-color-accent), 0 0 10px 1px var(--tq-color-accent)
			transform scale(1.06)
</style>
