<script lang="ts" setup>
import {Icon} from '@iconify/vue'

import type {InputBoxProps} from '../types'

interface Props extends InputBoxProps<void> {
	icon?: string
	label?: string
	tooltip?: string
	blink?: boolean
	gray?: boolean
	narrow?: boolean
}

defineProps<Props>()
</script>

<template>
	<button
		class="InputButton"
		:class="{blink, gray, narrow}"
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
	gap 4px

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

	.label
		line-height var(--tq-input-height)

	// Styles
	&.gray
		background var(--tq-color-input)
		color var(--tq-color-on-input)

		&:hover
			background var(--tq-color-accent-hover)

	&.blink
		animation blink .5s infinite
		animation-direction alternate

	@keyframes blink
		0%
			background var(--tq-color-input-vivid-accent)
		100%
			background var(--tq-color-accent-hover)

	&.narrow
		min-width auto
		width calc(var(--tq-input-height) * .75)

		.icon
			margin 0 -50%
</style>
