<script lang="ts" setup>
import {Icon} from '../Icon'
import {InputButtonToggleProps} from './types'

const model = defineModel<boolean>({required: true})

defineProps<InputButtonToggleProps>()
</script>

<template>
	<!--
		@mousedown.prevent keeps a mouse click from focusing the button (the click
		still toggles). Without it the button retains focus after a click and a
		later Enter/Space flips it again unexpectedly. Keyboard (Tab) focus is
		unaffected, so keyboard toggling still works — matching :focus-visible.
	-->
	<button
		class="TqInputButtonToggle"
		:class="{checked: model}"
		:inline-position="inlinePosition"
		:block-position="blockPosition"
		:disabled="!!disabled"
		@mousedown.prevent
		@click="model = !model"
	>
		<Icon v-if="icon" class="icon" :icon="icon" />
		<span v-if="label" class="label">{{ label }}</span>
	</button>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqInputButtonToggle
	border-radius var(--tq-radius-input)
	background var(--tq-color-input)
	color var(--tq-color-text)
	height var(--tq-input-height)
	min-width var(--tq-input-height)
	display flex
	align-items center
	justify-content center
	hover-transition(background, color)
	gap var(--tq-gap-related)

	use-input-position()

	// Unchecked: default accent ring just outside (on the input bg). Checked: an
	// inner ring in the off-state button color (input) sits on the accent fill,
	// plus an accent ring just OUTSIDE that reads against it at the edge. See
	// fill-focus-style().
	&:focus-visible
		fill-focus-style()

	&:hover
		background var(--tq-color-input-hover)

	&.checked
		background var(--tq-color-accent)
		color var(--tq-color-on-accent)
		--focus-ring inset 0 0 0 1px var(--tq-color-input), 0 0 0 1px var(--tq-color-accent)

		&:hover
			background var(--tq-color-accent-hover)

	&:has(.label)
		padding 0 .7em

	&:has(.icon):has(.label)
		padding-left .5em

	.icon
		display block
		width calc(var(--tq-input-height) - 4px)
		height calc(var(--tq-input-height) - 4px)

	.label
		line-height var(--tq-input-height)
</style>
