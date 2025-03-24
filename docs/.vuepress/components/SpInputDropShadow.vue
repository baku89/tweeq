<script setup lang="ts">
import {vec2} from 'linearly'

import SpInputColor from './SpInputColor.vue'
import SpInputNumber from './SpInputNumber.vue'

type Model = {
	offset: vec2
	blur: number
	spread: number
	color: string
}

defineProps<{
	modelValue: Model
}>()

const emit = defineEmits<{
	(e: 'update:modelValue', value: Model): void
}>()
</script>

<template>
	<div class="SpInputDropShadow">
		<SpInputNumber
			:modelValue="modelValue.offset[0]"
			:min="-100"
			:max="100"
			:step="0.1"
			label="X"
			@update:modelValue="
				emit('update:modelValue', {
					...modelValue,
					offset: [$event, modelValue.offset[1]],
				})
			"
		/>
		<SpInputNumber
			:modelValue="modelValue.offset[1]"
			:min="-100"
			:max="100"
			:step="0.1"
			label="Y"
			@update:modelValue="
				emit('update:modelValue', {
					...modelValue,
					offset: [modelValue.offset[0], $event],
				})
			"
		/>
		<SpInputNumber
			:modelValue="modelValue.blur"
			:min="0"
			:max="100"
			:step="0.1"
			label="Blur"
			@update:modelValue="
				emit('update:modelValue', {
					...modelValue,
					blur: $event,
				})
			"
		/>
		<SpInputNumber
			:modelValue="modelValue.spread"
			:min="-100"
			:max="100"
			:step="0.1"
			label="Spread"
			@update:modelValue="
				emit('update:modelValue', {
					...modelValue,
					spread: $event,
				})
			"
		/>
		<SpInputColor
			label="Color"
			:modelValue="modelValue.color"
			:alpha="true"
			@update:modelValue="
				emit('update:modelValue', {
					...modelValue,
					color: $event,
				})
			"
		/>
	</div>
</template>

<style lang="stylus" scoped>
.SpInputDropShadow
	display flex
	flex-direction column
</style>
