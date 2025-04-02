<script lang="ts" setup>
import {Icon} from '../Icon'
import type {InputButtonProps} from './types'

defineProps<InputButtonProps>()
</script>

<template>
	<button
		class="TqInputButton"
		:class="{blink, subtle}"
		:inline-position="inlinePosition"
		:block-position="blockPosition"
		:disabled="disabled"
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

	use-input-position()

	&:focus-visible
		button-focus-style()

	&:hover
		background var(--tq-color-accent-hover)

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

		&:not(:hover)
			color var(--tq-color-text)

		&:hover
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
