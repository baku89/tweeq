<script setup lang="ts">
import {InputGroup} from '../InputGroup'
import {InputNumber} from '../InputNumber'
import {InputVecProps} from './types'

const props = defineProps<InputVecProps>()

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

function horizontalPositionAt(i: number): 'left' | 'right' | 'middle' {
	return i === 0
		? 'left'
		: i === props.modelValue.length - 1
			? 'right'
			: 'middle'
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
			:horizontal-position="horizontalPositionAt(i)"
			@update:modelValue="updateValue(i, $event)"
		/>
	</InputGroup>
</template>
