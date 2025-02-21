<script setup lang="ts">
import {InputGroup} from '../InputGroup'
import {InputNumber} from '../InputNumber'

interface Props {
	modelValue: readonly number[]
	min?: readonly number[] | number
	max?: readonly number[] | number
	step?: readonly number[] | number
}

const props = defineProps<Props>()

const emit = defineEmits<{
	'update:modelValue': [readonly number[]]
}>()

function updateValue(index: number, value: number) {
	const newValue = [...props.modelValue]
	newValue[index] = value
	emit('update:modelValue', newValue)
}

function minAt(i: number): number | undefined {
	return Array.isArray(props.min) ? props.min[i] : props.min
}

function maxAt(i: number): number | undefined {
	return Array.isArray(props.max) ? props.max[i] : props.max
}

function stepAt(i: number): number | undefined {
	return Array.isArray(props.step) ? props.step[i] : props.step
}
</script>

<template>
	<InputGroup class="InputVec">
		<InputNumber
			v-for="(v, i) in modelValue"
			:key="i"
			:min="minAt(i)"
			:max="maxAt(i)"
			:step="stepAt(i)"
			:modelValue="v"
			@update:modelValue="updateValue(i, $event)"
		/>
	</InputGroup>
</template>
