<script lang="ts" setup>
import {Icon} from '../Icon'
import {InputButtonToggleProps} from './types'

const model = defineModel<boolean>({required: true})

defineProps<InputButtonToggleProps>()
</script>

<template>
	<button
		class="TqInputButtonToggle"
		:class="{checked: model}"
		:inline-position="inlinePosition"
		:block-position="blockPosition"
		:disabled="!!disabled"
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
	gap 4px

	use-input-position()

	&:focus-visible
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
