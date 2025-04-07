<script setup lang="ts" generic="T extends Record<string, unknown>">
import Case from 'case'
import {computed, nextTick} from 'vue'

import {InputAngle} from '../InputAngle'
import {InputCode} from '../InputCode'
import {InputColor} from '../InputColor'
import {InputNumber} from '../InputNumber'
import {InputPosition} from '../InputPosition'
import {InputString} from '../InputString'
import {InputSwitch} from '../InputSwitch'
import {InputTime} from '../InputTime'
import {InputVec} from '../InputVec'
import {Parameter, ParameterGrid, ParameterHeading} from '../ParameterGrid'
import {InputEmits} from '../types'
import type {InputComplexProps, Scheme} from './types'

const model = defineModel<T>({required: true})

const props = defineProps<InputComplexProps<T>>()

const emit = defineEmits<InputEmits>()

const entries = computed<[keyof T, Scheme<T>[keyof T]][]>(() => {
	return Object.entries(props.scheme)
})

function getComponentName(param: Scheme<T>[keyof T]) {
	if (param.type === 'number') {
		if (param.ui === 'angle') return InputAngle
		if (param.ui === 'time') return InputTime
		return InputNumber
	} else if (param.type === 'string') {
		if (param.ui === 'code') return InputCode
		if (param.ui === 'color') return InputColor
		return InputString
	} else if (param.type === 'boolean') {
		return InputSwitch
	} else if (param.type === 'vec2') {
		if (param.ui === 'position') return InputPosition
		return InputVec
	}
}

function getModelValue<K extends keyof T>(name: K) {
	return model.value[name] as any
}

function updateModelValue(name: keyof T, value: any) {
	commitChange(name, value)
}

let changedModel: T | undefined

function commitChange(name: keyof T, value: any) {
	if (!changedModel) {
		nextTick(() => {
			model.value = changedModel as T
			changedModel = undefined
		})

		changedModel = {...model.value}
	}

	changedModel[name] = value
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
	<ParameterGrid class="InputComplex">
		<ParameterHeading v-if="title">{{ title }}</ParameterHeading>
		<Parameter
			v-for="[name, param] in entries"
			:key="name"
			:label="param.label ?? Case.capital(name as any)"
			:icon="param.icon"
		>
			<component
				:is="getComponentName(param)"
				:modelValue="getModelValue(name)"
				v-bind="param"
				@update:modelValue="updateModelValue(name, $event)"
				@focus="emit('focus')"
				@blur="emit('blur')"
				@confirm="commitConfirm()"
			/>
		</Parameter>
	</ParameterGrid>
</template>

<style lang="stylus" scoped></style>
