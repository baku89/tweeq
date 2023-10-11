<script lang="ts" setup>
import {Icon} from '@iconify/vue'

import {InputProps} from './types'

interface Props extends InputProps {
	icon?: string
	label?: string
	tooltip?: string
}

defineProps<Props>()
</script>

<template>
	<button
		class="InputButton"
		:horizontal-position="horizontalPosition"
		:vertical-position="verticalPosition"
		:disabled="!!disabled"
	>
		<Icon v-if="icon" class="icon" :icon="icon" />
		<span v-if="label" class="label">{{ label }}</span>
	</button>
</template>

<style lang="stylus" scoped>
@import './common.styl'

.InputButton
	height var(--tq-input-height)
	min-width var(--tq-input-height)
	border-radius var(--tq-input-border-radius)
	background var(--tq-color-primary-container)
	color var(--tq-color-on-primary-container)
	display flex
	align-items center
	justify-content center
	hover-transition(background, color)
	gap 4px

	use-input-position()

	&:focus-visible
		box-shadow 0 0 0 1px var(--tq-color-primary)

	&:hover
		color var(--tq-color-on-primary)
		background var(--tq-color-primary)

	&:has(.label)
		padding 0 1em

	&:has(.icon):has(.label)
		padding-left .5em

	.icon
		display block

	.label
		line-height var(--tq-input-height)
</style>
