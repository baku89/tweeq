<script setup lang="ts">
import SpInputColor from './SpInputColor.vue'
import SpInputNumber from './SpInputNumber.vue'

type Model = {
	keyIntensity: number
	keyColor: string
	fillIntensity: number
	fillColor: string
	backIntensity: number
	backColor: string
}

defineProps<{
	modelValue: Model
}>()

const emit = defineEmits<{
	(e: 'update:modelValue', value: Model): void
}>()
</script>

<template>
	<div class="SpInputThreePointLighting">
		<SpInputNumber
			:modelValue="modelValue.keyIntensity"
			:min="0"
			:max="200"
			:step="0.1"
			label="Key Intensity"
			@update:modelValue="
				emit('update:modelValue', {...modelValue, keyIntensity: $event})
			"
		/>
		<SpInputColor
			label="Key Color"
			:modelValue="modelValue.keyColor"
			@update:modelValue="
				emit('update:modelValue', {...modelValue, keyColor: $event})
			"
		/>
		<SpInputNumber
			:modelValue="modelValue.fillIntensity"
			:min="0"
			:max="200"
			:step="0.1"
			label="Fill Intensity"
			@update:modelValue="
				emit('update:modelValue', {...modelValue, fillIntensity: $event})
			"
		/>
		<SpInputColor
			label="Fill Color"
			:modelValue="modelValue.fillColor"
			@update:modelValue="
				emit('update:modelValue', {...modelValue, fillColor: $event})
			"
		/>
		<SpInputNumber
			:modelValue="modelValue.backIntensity"
			:min="0"
			:max="200"
			:step="0.1"
			label="Back Intensity"
			@update:modelValue="
				emit('update:modelValue', {...modelValue, backIntensity: $event})
			"
		/>
		<SpInputColor
			label="Back Color"
			:modelValue="modelValue.backColor"
			@update:modelValue="
				emit('update:modelValue', {...modelValue, backColor: $event})
			"
		/>
	</div>
</template>

<style lang="stylus" scoped>
.SpInputDropShadow
	display flex
	flex-direction column
</style>
