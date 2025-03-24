<script setup lang="ts">
import {InputEmits, InputNumberProps} from 'tweeq'

defineProps<InputNumberProps & {label: string}>()

const emit = defineEmits<InputEmits<number>>()

function onInput(e: any) {
	emit('update:modelValue', e.target.__value)
}
</script>

<template>
	<sp-theme system="spectrum" color="light" scale="medium">
		<sp-slider
			:label="label"
			:min="min"
			:max="max"
			:step="step"
			:value="modelValue"
			editable
			@input="onInput"
		/>
	</sp-theme>
</template>
