<script setup lang="ts">
import {InputNumber} from '../InputNumber'
import {InputHorizontalPosition} from '../types'

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

function getMin(i: number): number | undefined {
	return Array.isArray(props.min) ? props.min[i] : props.min
}

function getMax(i: number): number | undefined {
	return Array.isArray(props.max) ? props.max[i] : props.max
}

function getStep(i: number): number | undefined {
	return Array.isArray(props.step) ? props.step[i] : props.step
}

function getHorizontalPosition(i: number): InputHorizontalPosition {
	if (i === 0) return 'left'
	if (i === props.modelValue.length - 1) return 'right'
	return 'middle'
}
</script>

<template>
	<div class="InputVec">
		<InputNumber
			v-for="(v, i) in modelValue"
			:key="i"
			:min="getMin(i)"
			:max="getMax(i)"
			:step="getStep(i)"
			:modelValue="v"
			:horizontalPosition="getHorizontalPosition(i)"
			@update:modelValue="updateValue(i, $event)"
		/>
	</div>
</template>

<style lang="stylus" scoped>
.InputVec
	display grid
	grid-template-columns 1fr 1fr 1fr
</style>
