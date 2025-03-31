<script setup lang="ts">
import {InputEmits, InputNumberProps} from 'tweeq'

const model = defineModel<number>({required: true})

defineProps<InputNumberProps & {label: string}>()

defineEmits<InputEmits>()

function onInput(e: any) {
	model.value = e.target.value
}
</script>

<template>
	<sp-theme system="spectrum" color="light" scale="medium">
		<sp-slider
			class="slider"
			hide-stepper
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
