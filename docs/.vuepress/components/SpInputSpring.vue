<script setup lang="ts">
import SpInputNumber from './SpInputNumber.vue'

type Model = {
	stiffness: number
	damping: number
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
			:modelValue="modelValue.stiffness"
			:min="0"
			:max="1000"
			:step="0.1"
			label="Stiffness"
			@update:modelValue="
				emit('update:modelValue', {
					...modelValue,
					stiffness: $event,
				})
			"
		/>
		<SpInputNumber
			:modelValue="modelValue.damping"
			:min="0"
			:max="1"
			:step="0.01"
			label="Damping"
			@update:modelValue="
				emit('update:modelValue', {
					...modelValue,
					damping: $event,
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
