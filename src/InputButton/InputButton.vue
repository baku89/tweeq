<script lang="ts" setup>
import {useResizeObserver} from '@vueuse/core'
import {computed, nextTick, ref, watch} from 'vue'

import {Icon} from '../Icon'
import {vTooltip} from '../Tooltip'
import {useFlash} from '../use/useFlash'
import type {InputButtonProps} from './types'

const props = defineProps<InputButtonProps>()

// Imperative attention flash: a parent grabs this button via a template ref and
// calls `.flash()` to pulse it (e.g. to point the eye at the next action).
const {flashing, flash} = useFlash()

defineExpose({flash})

// Keep icon + label on one line; when the button is squeezed narrower than its
// content the label clips to an ellipsis (see CSS). Detect that clip and surface
// the full text as a tooltip so nothing becomes unreadable. An explicit
// `tooltip` prop always wins over this fallback.
const $label = ref<HTMLSpanElement>()
const truncated = ref(false)

function measure() {
	const el = $label.value
	truncated.value = el ? el.scrollWidth > el.clientWidth + 0.5 : false
}

// ResizeObserver catches the squeeze/grow; the watch catches a label text swap
// that changes truncation without changing the (clipped) box size.
useResizeObserver($label, measure)
watch(
	() => props.label,
	() => nextTick(measure)
)

const tooltipContent = computed(
	() => props.tooltip ?? (truncated.value ? props.label : undefined)
)
</script>

<template>
	<button
		class="TqInputButton"
		:class="{blink, subtle, ghost, narrow, flashing}"
		:inline-position="inlinePosition"
		:block-position="blockPosition"
		:disabled="disabled"
		v-tooltip="tooltipContent"
		@mousedown.prevent
	>
		<!--
			Keep this comment INSIDE <button> so the template stays single-root. A
			leading sibling comment makes this component's $el resolve to the comment
			node instead of the <button>, breaking callers that read $el as the
			element (e.g. anchoring a Popover to it).

			@mousedown.prevent stops a mouse click from focusing the button (the
			click still fires). Otherwise the button keeps focus after a click and a
			later Enter/Space re-activates it unexpectedly. Keyboard (Tab) focus is
			unaffected, so keyboard activation still works — matching :focus-visible.
		-->
		<Icon v-if="icon" class="icon" :icon="icon" />
		<span v-if="label" ref="$label" class="label">{{ label }}</span>
		<span v-if="chevron" class="chevron"><Icon icon="mdi:chevron-down" /></span>
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
	// Its own, rather than whatever it is in has, such as a grab where it is dragged by.
	cursor pointer

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

	// A label earns horizontal breathing room; a leading icon trims the left side;
	// a trailing chevron (slim, pinned to the edge) trims the right side.
	&:has(.label)
		padding-inline .75em

	&:has(.label):has(.icon)
		padding-left .5em

	&:has(.chevron)
		padding-right .6em

	// Narrow: shed the square min-width down to a hair of horizontal padding so an
	// icon-only button nearly hugs its glyph (height is unchanged, so it still
	// lines up in an InputGroup). A label keeps its own wider padding, so this
	// only ever slims the icon-only case.
	&.narrow
		min-width 0
		padding-inline 1px

	.icon
		display block
		flex-shrink 0

	// Trailing disclosure chevron, pinned to the right edge (which left-aligns the
	// leading icon + label). mdi:chevron-down fills only the middle ~half of its
	// icon box, so the wrapper is sized to that real width and the glyph overflows
	// it symmetrically — no whitespace padding it off the edge.
	.chevron
		flex none
		display grid
		place-items center
		width calc(var(--tq-icon-size) * 0.5)
		margin-left auto
		opacity 0.6

	// The button is one line tall: a label never wraps, it sets the minimum width.
	.label
		line-height var(--tq-input-height)
		min-width 0
		overflow hidden
		white-space nowrap
		text-overflow ellipsis

	// Styles
	// Subtle: an achromatic neutral fill at rest (more present than the
	// input/checkbox-off tone) that lights up to accent on hover.
	&.subtle
		background var(--tq-color-neutral)
		--bg var(--tq-color-neutral)
		--bg-blink var(--tq-color-neutral-hover)
		--focus-ring 0 0 0 1px var(--tq-color-accent)

		&:not(:hover)
		&:disabled
			color var(--tq-color-text)

		&:not(:disabled):hover
			background var(--tq-color-accent-hover)

	// Ghost: nothing but its label at rest, and a fill only while hovered, for what is
	// there to be pressed and is not what anything is about, such as closing something.
	&.ghost
		background transparent
		color var(--tq-color-text-mute)
		--focus-ring 0 0 0 1px var(--tq-color-accent)

		&:not(:disabled):hover
			background var(--tq-color-input-hover)
			color var(--tq-color-text)

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
