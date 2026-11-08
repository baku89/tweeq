<script setup lang="ts">
/**
 * As many numbers as there are to be, in a row: a dash pattern, a list of stops. Each
 * is a number input of its own, with Remove on its menu, and a + at the end adds one.
 */
import {computed} from 'vue'

import {InputButton} from '../InputButton'
import {InputNumber} from '../InputNumber'
import type {InputNumberListProps} from './types'

const props = withDefaults(defineProps<InputNumberListProps>(), {atLeast: 0})

const model = defineModel<readonly number[]>({required: true})

const canRemove = computed(() => model.value.length > props.atLeast)

function setAt(index: number, value: number) {
	model.value = model.value.map((n, i) => (i === index ? value : n))
}

function removeAt(index: number) {
	if (!canRemove.value) return
	model.value = model.value.filter((_, i) => i !== index)
}

function add() {
	const last = model.value.at(-1)
	model.value = [...model.value, props.added ?? last ?? 1]
}
</script>

<template>
	<div class="TqInputNumberList" :class="{disabled}">
		<InputNumber
			v-for="(value, index) in model"
			:key="index"
			class="number"
			:modelValue="value"
			:min="min"
			:max="max"
			:step="step"
			:precision="precision"
			:suffix="suffix"
			:disabled="disabled"
			:menuItems="canRemove ? [{label: 'Remove', icon: 'mdi:close', perform: () => removeAt(index)}] : []"
			@update:modelValue="setAt(index, $event)"
		/>
		<InputButton class="add" icon="mdi:plus" tooltip="Add" subtle :disabled="disabled" @click="add" />
	</div>
</template>

<style lang="stylus" scoped>
.TqInputNumberList
	display flex
	flex-wrap wrap
	gap var(--tq-gap-related)
	min-width 0

.number
	flex 1 1 2.5em
	min-width 2.5em

.add
	flex none
	width var(--tq-input-height)
	padding 0
</style>
