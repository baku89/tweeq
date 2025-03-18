<script lang="ts" setup>
import {Icon} from '@iconify/vue'

import type {InputButtonProps} from './types'

defineProps<InputButtonProps>()
</script>

<template>
	<button
		class="InputButton"
		:class="{blink, subtle, narrow}"
		:horizontal-position="horizontalPosition"
		:vertical-position="verticalPosition"
		:disabled="disabled"
	>
		<Icon v-if="icon" class="icon" :icon="icon" />
		<span v-if="label" class="label">{{ label }}</span>
	</button>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.InputButton
	height var(--tq-input-height)
	min-width var(--tq-input-height)
	border-radius var(--tq-input-border-radius)
	background var(--tq-color-accent)
	color var(--tq-color-on-accent)
	display flex
	align-items center
	justify-content center
	hover-transition(background, color)
	gap 2px

	use-input-position()
	button-focus-style()

	&:hover
		background var(--tq-color-accent-hover)

	&:has(.label)
		padding 0 1em

	&:has(.icon):has(.label)
		padding-left .5em

	.icon
		display block
		font-size var(--tq-input-height)

	.label
		line-height var(--tq-input-height)

	// Styles
	&.subtle
		background var(--tq-color-input)

		&:not(:hover)
			color var(--tq-color-on-input)

		&:hover
			background var(--tq-color-accent-hover)

	&.blink
		animation blink .5s infinite
		animation-direction alternate

	@keyframes blink
		0%
			background var(--tq-color-accent)
		100%
			background var(--tq-color-accent-hover)

	&.narrow
		min-width auto
		width calc(var(--tq-input-height) * .75)

		.icon
			margin 0 -50%
</style>
