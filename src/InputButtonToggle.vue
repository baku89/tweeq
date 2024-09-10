<script lang="ts" setup>
import {Icon} from '@iconify/vue'

import {InputProps} from './types'

interface Props extends InputProps {
	modelValue: boolean
	icon?: string
	label?: string
}

defineProps<Props>()

defineEmits<{
	'update:modelValue': [boolean]
}>()
</script>

<template>
	<button
		class="InputButtonToggle"
		:class="{checked: modelValue}"
		:horizontal-position="horizontalPosition"
		:vertical-position="verticalPosition"
		:disabled="!!disabled"
		@click="$emit('update:modelValue', !modelValue)"
	>
		<Icon v-if="icon" class="icon" :icon="icon" />
		<span v-if="label" class="label">{{ label }}</span>
	</button>
</template>

<style lang="stylus" scoped>
@import './common.styl'

.InputButtonToggle
	border-radius var(--tq-input-border-radius)
	background var(--tq-color-input)
	color var(--tq-color-on-background)
	height var(--tq-input-height)
	min-width var(--tq-input-height)
	display flex
	align-items center
	justify-content center
	hover-transition(background, color)
	gap 4px

	use-input-position()
	button-focus-style()

	&:hover
		background var(--tq-color-input-hover)

	&.checked
		background var(--tq-color-accent)
		color var(--tq-color-on-accent)

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
