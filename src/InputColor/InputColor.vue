<script setup lang="ts">
import {useElementSize} from '@vueuse/core'
import chroma from 'chroma-js'
import {computed, ref, useTemplateRef} from 'vue'

import {InputGroup} from '../InputGroup'
import {InputNumber} from '../InputNumber'
import {InputString} from '../InputString'
import {useThemeStore} from '../stores/theme'
import {InputEmits} from '../types'
import * as V from '../validator'
import InputColorPad from './InputColorPad.vue'
import type {InputColorProps} from './types'

const model = defineModel<string>({required: true})
const props = defineProps<InputColorProps>()
const emit = defineEmits<InputEmits>()

const theme = useThemeStore()

const $root = useTemplateRef('$root')
const {width} = useElementSize($root)

const showColorCode = computed(() => width.value > theme.inputHeight * 3.5)

const padTweaking = ref(false)

const color = computed(() => {
	if (chroma.valid(model.value)) {
		return chroma(model.value)
	}

	return chroma('black')
})

const opaqueColor = computed(() => color.value.alpha(1).hex())

const alpha = computed(() => color.value.alpha() * 100)

function onInputOpaqueColor(value: string) {
	const color = chroma(value)

	if (color.alpha() * 100 !== alpha.value) {
		model.value = value
	} else {
		model.value = color.alpha(alpha.value / 100).hex()
	}
}

function onUpdateAlpha(value: number) {
	model.value = color.value.alpha(value / 100).hex()
}
</script>

<template>
	<InputGroup ref="$root" class="TqInputColor">
		<InputColorPad
			v-bind="props"
			v-model="model"
			v-model:tweaking="padTweaking"
			:class="{'only-pad': !showColorCode}"
			:inlinePosition="showColorCode ? 'start' : undefined"
			@focus="emit('focus')"
			@blur="emit('blur')"
			@confirm="emit('confirm')"
		/>
		<InputString
			v-if="showColorCode"
			class="color-code"
			:class="{'pad-tweaking': padTweaking}"
			font="monospace"
			:modelValue="opaqueColor"
			:validator="V.colorCode"
			:inlinePosition="props.alpha ? 'middle' : 'end'"
			@update:modelValue="onInputOpaqueColor"
			@focus="emit('focus')"
			@blur="emit('blur')"
			@confirm="emit('confirm')"
		/>
		<InputNumber
			v-if="props.alpha && showColorCode"
			class="alpha"
			:modelValue="alpha"
			:validator="V.colorCode"
			suffix="%"
			:min="0"
			:max="100"
			inlinePosition="end"
			@update:modelValue="onUpdateAlpha"
		/>
	</InputGroup>
</template>

<style lang="stylus" scoped>
@import './common.styl'

:deep(.only-pad)
	flex-grow 1
	width 100%

	.default-button
		width 100%

.color-code
	&:deep(input.input)
		active-transition(text-indent)

	&.pad-tweaking
		&:deep(input.input)
			text-indent var(--tq-input-height)

.alpha
	flex-grow 0
	width calc(var(--tq-input-height) * 2)
</style>
