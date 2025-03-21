<script setup lang="ts" generic="T extends Record<string, unknown>">
import Case from 'case'
import {computed, shallowRef, toRaw, watchEffect} from 'vue'

import {InputAngle} from '../InputAngle'
import {InputCode} from '../InputCode'
import {InputColor} from '../InputColor'
import {InputNumber} from '../InputNumber'
import {InputString} from '../InputString'
import {InputSwitch} from '../InputSwitch'
import {Parameter, ParameterGrid, ParameterHeading} from '../ParameterGrid'
import type {InputComplexProps, Scheme} from './types'

const props = defineProps<InputComplexProps<T>>()

const currentValue = shallowRef<T>(toRaw(props.modelValue))

watchEffect(() => {
	currentValue.value = toRaw(props.modelValue)
})

const emit = defineEmits<{
	'update:modelValue': [T]
}>()

const entries = computed<[keyof T, Scheme<T>[keyof T]][]>(() => {
	return Object.entries(props.scheme)
})

function updateModelValue(name: keyof T, value: any) {
	currentValue.value = {...currentValue.value, [name]: value}
	emit('update:modelValue', currentValue.value)
}

function getModelValue<K extends keyof T>(name: K) {
	return currentValue.value[name] as any
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
			<template v-if="param.type === 'number'">
				<InputAngle
					v-if="param.ui === 'angle'"
					:modelValue="getModelValue(name)"
					v-bind="param"
					@update:modelValue="updateModelValue(name, $event)"
				/>
				<InputNumber
					v-else
					:modelValue="getModelValue(name)"
					v-bind="param"
					@update:modelValue="updateModelValue(name, $event)"
				/>
			</template>
			<template v-else-if="param.type === 'string'">
				<InputCode
					v-if="param.ui === 'code'"
					:modelValue="getModelValue(name)"
					v-bind="param"
					@update:modelValue="updateModelValue(name, $event)"
				/>
				<InputColor
					v-else-if="param.ui === 'color'"
					:modelValue="getModelValue(name)"
					v-bind="param"
					@update:modelValue="updateModelValue(name, $event)"
				/>
				<InputString
					v-else
					:modelValue="getModelValue(name)"
					v-bind="param"
					@update:modelValue="updateModelValue(name, $event)"
				/>
			</template>
			<InputSwitch
				v-else-if="param.type === 'boolean'"
				:modelValue="getModelValue(name)"
				v-bind="param"
				@update:modelValue="updateModelValue(name, $event)"
			/>
		</Parameter>
	</ParameterGrid>
</template>

<style lang="stylus" scoped></style>
