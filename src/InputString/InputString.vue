<script lang="ts" setup>
import {type MaybeElementRef} from '@vueuse/core'
import {ref, ref as shallowRef, watch} from 'vue'

import {InputEmits} from '../types'
import {type InputStringProps} from './types'

const props = defineProps<InputStringProps>()

const display = ref(props.modelValue)

const $input: MaybeElementRef = shallowRef(null)

watch(
	() => props.modelValue,
	value => {
		display.value = value
	},
	{immediate: true}
)

const emit = defineEmits<InputEmits<string>>()

function onFocus(e: Event) {
	;(e.target as HTMLInputElement).select()
	emit('focus')
}

function onInput(e: Event) {
	const newValue = (e.target as HTMLInputElement).value
	display.value = newValue

	emit('update:modelValue', newValue)
}

function onBlur() {
	emit('confirm')
	emit('blur')
}
</script>

<template>
	<div
		class="InputString"
		:class="[theme]"
		:font="font"
		:align="align"
		:horizontal-position="horizontalPosition"
		:vertical-position="verticalPosition"
		:disabled="!!disabled"
	>
		<input
			ref="$input"
			class="input"
			type="text"
			:value="display"
			:disabled="disabled"
			:invalid="invalid || undefined"
			@focus="onFocus"
			@blur="onBlur"
			@input.stop="onInput"
			@keydown.enter="emit('confirm')"
		/>
	</div>
</template>

<style lang="stylus">
@import '../common.styl'

.InputString
	input-style()
</style>
