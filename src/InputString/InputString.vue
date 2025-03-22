<script lang="ts" setup>
import {ref, useTemplateRef, watch} from 'vue'

import {InputEmits} from '../types'
import {type InputStringProps} from './types'

const props = defineProps<InputStringProps>()

const display = ref(props.modelValue)

const $input = useTemplateRef('$input')

watch(
	() => props.modelValue,
	value => {
		display.value = value
	},
	{immediate: true}
)

const emit = defineEmits<
	Omit<InputEmits<string>, 'focus'> & {focus: [e: FocusEvent]}
>()

function onFocus(e: FocusEvent) {
	emit('focus', e)
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

defineExpose({
	select: () => {
		$input.value?.select()
	},
})
</script>

<template>
	<input
		ref="$input"
		class="InputString"
		type="text"
		:value="display"
		:theme="theme"
		:font="font"
		:align="align"
		:horizontal-position="horizontalPosition"
		:vertical-position="verticalPosition"
		:disabled="disabled || undefined"
		:invalid="invalid || undefined"
		@focus="onFocus"
		@blur="onBlur"
		@input.stop="onInput"
		@keydown.enter="emit('confirm')"
	/>
</template>

<style lang="stylus">
@import '../common.styl'

.InputString
	input-box-style()
	input-element-style()

	&:focus
		input-box-focus()

	&:disabled
		input-box-disabled()

	&[invalid]
		input-box-invalid()
</style>
