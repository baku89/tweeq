<script setup lang="ts">
import {useElementSize} from '@vueuse/core'
import {computed, useTemplateRef} from 'vue'

import {InputNumber} from '../InputNumber'
import {InputRotery} from '../InputRotery'
import type {InputRoteryProps} from '../InputRotery/types'
import {useThemeStore} from '../stores/theme'
import {InputEmits} from '../types'

const model = defineModel<number>({required: true})

const props = defineProps<InputRoteryProps>()

const emit = defineEmits<InputEmits>()

const theme = useThemeStore()

const $root = useTemplateRef('$root')
const {width} = useElementSize($root)

const showNumber = computed(() => width.value > theme.inputHeight * 4)
</script>

<template>
	<div ref="$root" class="TqInputAngle">
		<InputRotery
			v-bind="props"
			v-model="model"
			@focus="emit('focus')"
			@blur="emit('blur')"
			@confirm="emit('confirm')"
		/>
		<InputNumber
			v-if="showNumber"
			v-bind="props"
			v-model="model"
			class="number"
			suffix="°"
			@focus="emit('focus')"
			@blur="emit('blur')"
			@confirm="emit('confirm')"
		/>
	</div>
</template>

<style lang="stylus" scoped>
.TqInputAngle
	display flex
	gap var(--tq-input-gap)
</style>
