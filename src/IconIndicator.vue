<script lang="ts" setup>
import {Icon} from '@iconify/vue'

interface Props {
	modelValue: boolean
	icon: string
	label?: string
}

defineProps<Props>()
</script>

<template>
	<div
		class="IconIndicator"
		:class="{on: modelValue}"
		@click="$emit('update:modelValue', !modelValue)"
	>
		<Icon v-if="icon" class="icon" :icon="icon" />
	</div>
</template>

<style lang="stylus" scoped>
@import './common.styl'

.IconIndicator
	color var(--tq-color-gray-on-background)
	height var(--tq-input-height)
	width var(--tq-input-height)
	display flex
	align-items center
	justify-content center
	hover-transition(color, filter)
		filter: drop-shadow(0 0 calc(var(--tq-input-height) * 0) transparent)

	&.on
		color var(--tq-color-on-primary)
		filter: drop-shadow(0 0 calc(var(--tq-input-height) * .1) var(--tq-color-primary))

	.icon
		display block
		width calc(var(--tq-input-height) - 4px)
		height calc(var(--tq-input-height) - 4px)
</style>
