<script setup lang="ts" generic="T extends Record<string, any>">
import {capital} from 'case'
import {computed} from 'vue'

import InputCheckbox from '../InputCheckbox'
import InputCode from '../InputCode'
import InputNumber from '../InputNumber'
import InputString from '../InputString'
import {Parameter, ParameterGrid, ParameterHeading} from '../ParameterGrid'
import {InputComplexProps, ParameterDesc} from './types'

const props = defineProps<InputComplexProps<T>>()

const emit = defineEmits<{
	'update:modelValue': [T]
}>()

const entries = computed<[keyof T, ParameterDesc][]>(() => {
	return Object.entries(props.scheme) as any
})

function updateModelValue(name: keyof T, value: any) {
	const modelValue: T = {...props.modelValue, [name]: value}
	emit('update:modelValue', modelValue)
}

function getModelValue(name: keyof T) {
	return props.modelValue[name]
}
</script>

<template>
	<ParameterGrid class="InputComplex">
		<ParameterHeading v-if="title">{{ title }}</ParameterHeading>
		<Parameter
			v-for="[name, param] in entries"
			:key="name"
			:label="param.label ?? capital(name as any)"
			:icon="param.icon"
		>
			<InputNumber
				v-if="param.type === 'number'"
				:modelValue="getModelValue(name)"
				v-bind="param"
				@update:modelValue="updateModelValue(name, $event)"
			/>
			<template v-else-if="param.type === 'string'">
				<InputCode
					v-if="param.ui === 'code'"
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
			<InputCheckbox
				v-else-if="param.type === 'boolean'"
				:modelValue="getModelValue(name)"
				v-bind="param"
				@update:modelValue="updateModelValue(name, $event)"
			/>
		</Parameter>
	</ParameterGrid>
</template>

<style lang="stylus" scoped></style>
