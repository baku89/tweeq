<script setup lang="ts">
import {useElementSize} from '@vueuse/core'
import {computed, useTemplateRef} from 'vue'

import {InputGroup} from '../InputGroup'
import {InputString} from '../InputString'
import {useThemeStore} from '../stores/theme'
import {InputEmits} from '../types'
import InputColorPad from './InputColorPad.vue'
import type {InputColorProps} from './types'

const props = defineProps<InputColorProps>()
const emit = defineEmits<InputEmits<string>>()

const theme = useThemeStore()

const $root = useTemplateRef('$root')
const {width} = useElementSize($root)

const showColorCode = computed(() => width.value > theme.inputHeight * 3.5)
</script>

<template>
	<InputGroup ref="$root" class="TqInputColor">
		<InputColorPad
			v-bind="props"
			:class="{'only-pad': !showColorCode}"
			:horizontalPosition="showColorCode ? 'left' : undefined"
			@update:modelValue="emit('update:modelValue', $event)"
			@focus="emit('focus')"
			@blur="emit('blur')"
			@confirm="emit('confirm')"
		/>
		<InputString
			v-if="showColorCode"
			font="monospace"
			:modelValue="modelValue"
			horizontalPosition="right"
			@update:modelValue="emit('update:modelValue', $event)"
			@focus="emit('focus')"
			@blur="emit('blur')"
			@confirm="emit('confirm')"
		/>
	</InputGroup>
</template>

<style lang="stylus" scoped>
:deep(.only-pad)
	flex-grow 1
	width 100%

	.default-button
		width 100%
</style>
