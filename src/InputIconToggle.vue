<script lang="ts" setup>
import {Icon} from '@iconify/vue'

interface Props {
	modelValue: boolean
	icon: string
	label?: string
}

defineProps<Props>()

defineEmits<{
	'update:modelValue': [boolean]
}>()
</script>

<template>
	<button
		class="InputIconToggle"
		:class="{checked: modelValue}"
		@click="$emit('update:modelValue', !modelValue)"
	>
		<Icon v-if="icon" class="icon" :icon="icon" />
	</button>
</template>

<style lang="stylus" scoped>
@import './common.styl'

.InputIconToggle
	border-radius var(--tq-input-border-radius)
	background var(--tq-color-input)
	color var(--tq-color-on-input)
	height var(--tq-input-height)
	min-width var(--tq-input-height)
	display flex
	align-items center
	justify-content center
	hover-transition(background, color)
	gap 4px

	&:focus-visible
		box-shadow 0 0 0 1px var(--tq-color-primary)

	&:hover
		background var(--tq-color-input-hover)

	&.checked
		background var(--tq-color-primary)
		color var(--tq-color-on-primary)

		&:hover
			background var(--tq-color-input-primary-hover)

	&:has(.label)
		padding 0 1em

	&:has(.icon):has(.label)
		padding-left .5em

	.icon
		display block
		width calc(var(--tq-input-height) - 4px)
		height calc(var(--tq-input-height) - 4px)

	.label
		line-height var(--tq-input-height)
</style>
