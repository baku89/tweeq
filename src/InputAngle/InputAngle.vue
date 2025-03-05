<script setup lang="ts">
import {useElementSize} from '@vueuse/core'
import {computed, ref} from 'vue'

import {InputNumber} from '../InputNumber'
import {InputRotery} from '../InputRotery'
import type {InputRoteryProps} from '../InputRotery/types'
import {useThemeStore} from '../stores/theme'

const props = defineProps<InputRoteryProps>()

const emit = defineEmits<{
	'update:modelValue': [number]
	change: [number]
}>()

const theme = useThemeStore()

const $root = ref<HTMLElement>()
const {width} = useElementSize($root)

const showNumber = computed(() => width.value > theme.inputHeight * 4)
</script>

<template>
	<div ref="$root" class="InputAngle">
		<InputRotery
			v-bind="props"
			@update:modelValue="emit('update:modelValue', $event)"
			@change="emit('change', $event)"
		/>
		<InputNumber
			v-if="showNumber"
			class="number"
			v-bind="props"
			:precision="0"
			suffix="°"
			@update:modelValue="emit('update:modelValue', $event)"
			@change="emit('change', $event)"
		/>
	</div>
</template>

<style lang="stylus" scoped>
.InputAngle
	display grid
	grid-template-columns min-content 1fr
	gap var(--tq-input-gap)
</style>
