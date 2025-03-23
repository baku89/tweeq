<script setup lang="ts" generic="T extends readonly number[]">
import {InputGroup} from '../InputGroup'
import {InputNumber} from '../InputNumber'
import {InputEmits} from '../types'
import {InputVecProps} from './types'

const props = defineProps<InputVecProps<T>>()

const emit = defineEmits<InputEmits<T, [index: number]>>()

function updateValue(index: number, value: number) {
	const newValue = [...props.modelValue]
	newValue[index] = value

	emit('update:modelValue', newValue as unknown as T, index)
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

function leftIconAt(i: number) {
	return Array.isArray(props.icon) ? props.icon[i] : props.icon
}

function inlinePositionAt(i: number) {
	return i === 0
		? 'start'
		: i === props.modelValue.length - 1
			? 'end'
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
			:leftIcon="leftIconAt(i)"
			:modelValue="v"
			:inline-position="inlinePositionAt(i)"
			@update:modelValue="updateValue(i, $event)"
			@focus="emit('focus', i)"
			@blur="emit('blur', i)"
			@confirm="emit('confirm', i)"
		/>
	</InputGroup>
</template>
