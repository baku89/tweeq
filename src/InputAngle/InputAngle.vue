<script setup lang="ts">
import {useElementSize} from '@vueuse/core'
import {computed, useTemplateRef} from 'vue'

import {InputNumber} from '../InputNumber'
import {InputRotery} from '../InputRotery'
import type {InputRoteryProps} from '../InputRotery/types'
import {useThemeStore} from '../stores/theme'
import {InputEmits} from '../types'

const props = defineProps<InputRoteryProps>()

const emit = defineEmits<InputEmits<number>>()

const theme = useThemeStore()

const $root = useTemplateRef('$root')
const {width} = useElementSize($root)

const showNumber = computed(() => width.value > theme.inputHeight * 4)
</script>

<template>
	<div ref="$root" class="InputAngle">
		<InputRotery
			v-bind="props"
			@update:modelValue="emit('update:modelValue', $event)"
			@focus="emit('focus')"
			@blur="emit('blur')"
			@confirm="emit('confirm')"
		/>
		<InputNumber
			v-if="showNumber"
			class="number"
			v-bind="props"
			suffix="°"
			@update:modelValue="emit('update:modelValue', $event)"
			@focus="emit('focus')"
			@blur="emit('blur')"
			@confirm="emit('confirm')"
		/>
	</div>
</template>

<style lang="stylus" scoped>
.InputAngle
	display grid
	grid-template-columns min-content 1fr
	gap var(--tq-input-gap)
</style>
