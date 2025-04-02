<script setup lang="ts" generic="T extends readonly number[]">
import {nextTick} from 'vue'

import {InputGroup} from '../InputGroup'
import {InputNumber} from '../InputNumber'
import {InputEmits} from '../types'
import {InputVecProps} from './types'

const model = defineModel<T>({required: true})

const props = defineProps<InputVecProps<T>>()

const emit = defineEmits<InputEmits>()

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
	return i === 0 ? 'start' : i === model.value.length - 1 ? 'end' : 'middle'
}

let changedModel: number[] | undefined

function commitChange(index: number, value: number) {
	if (!changedModel) {
		nextTick(() => {
			model.value = changedModel as unknown as T
			changedModel = undefined
		})

		changedModel = [...model.value]
	}

	changedModel[index] = value
}

let willConfirm = false
function commitConfirm() {
	if (!willConfirm) {
		nextTick(() => {
			emit('confirm')
			willConfirm = false
		})
	}
	willConfirm = true
}
</script>

<template>
	<InputGroup class="TqInputVec">
		<InputNumber
			v-for="(v, i) in model"
			:key="i"
			:min="minAt(i)"
			:max="maxAt(i)"
			:step="stepAt(i)"
			:leftIcon="leftIconAt(i)"
			:modelValue="v"
			:inline-position="inlinePositionAt(i)"
			@update:modelValue="commitChange(i, $event)"
			@focus="emit('focus')"
			@blur="emit('blur')"
			@confirm="commitConfirm()"
		/>
	</InputGroup>
</template>
