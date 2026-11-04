<script lang="ts" setup generic="T">
import {computed} from 'vue'

import {InputDropdown} from '../InputDropdown'
import {InputRadio} from '../InputRadio'
import {type InputEmits, useLabelizer} from '../types'
import type {InputEnumProps} from './types'
import {fitsInRow} from './utils'

const model = defineModel<T>({required: true})

const props = defineProps<InputEnumProps<T>>()

defineEmits<InputEmits>()

const labelizer = useLabelizer(props)

const inRow = computed(() =>
	fitsInRow(props.options.map(labelizer.value), props.icons !== undefined)
)
const icons = computed(() => (props.icons ? [...props.icons] : undefined))
</script>

<template>
	<InputRadio
		v-if="inRow"
		v-model="model as T"
		:options="options"
		:icons="icons"
		:labelizer="labelizer"
		@focus="$emit('focus')"
		@blur="$emit('blur')"
		@confirm="$emit('confirm')"
	/>
	<InputDropdown
		v-else
		v-model="model as T"
		:options="options"
		:icons="icons"
		:labelizer="labelizer"
		:theme="theme"
		:font="font"
		:disabled="disabled"
		:invalid="invalid"
		@focus="$emit('focus')"
		@blur="$emit('blur')"
		@confirm="$emit('confirm')"
	/>
</template>
