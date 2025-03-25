<script lang="ts" setup>
import {useTemplateRef} from 'vue'

import {
	type InputAlign,
	type InputBoxProps,
	type InputFont,
	type InputTheme,
} from '../types'

export interface InputTextBaseProps extends InputBoxProps<string> {
	ignoreInput?: boolean
	active?: boolean
	theme?: InputTheme
	font?: InputFont
	align?: InputAlign
}

defineProps<InputTextBaseProps>()

const emit = defineEmits<{
	focus: [e: FocusEvent]
	blur: [e: FocusEvent]
	keydown: [e: KeyboardEvent]
	confirm: []
	'update:modelValue': [value: string]
	'update:focused': [value: boolean]
}>()

const $input = useTemplateRef('$input')

defineExpose({
	select: () => {
		$input.value?.select()
	},
})

function onInput(e: Event) {
	emit('update:modelValue', (e.target as HTMLInputElement).value)
}

function onFocus(e: FocusEvent) {
	emit('update:focused', true)
	emit('focus', e)
}

function onBlur(e: FocusEvent) {
	emit('update:focused', false)
	emit('blur', e)
}
</script>

<template>
	<div
		class="TqInputTextBase"
		:class="{active, invalid}"
		:theme="theme"
		:font="font"
		:align="align"
	>
		<slot name="back" />
		<input
			ref="$input"
			class="input"
			type="text"
			:class="{ignore: ignoreInput}"
			:value="modelValue"
			:inline-position="inlinePosition"
			:block-position="blockPosition"
			:disabled="disabled || undefined"
			@focus="onFocus"
			@blur="onBlur"
			@input="onInput"
			@keydown="emit('keydown', $event)"
			@keydown.enter="emit('confirm')"
		/>
		<slot name="front" />
	</div>
</template>

<style lang="stylus">
@import '../common.styl'

.TqInputTextBase
	input-box-style()

	&:focus-within, &.active
		input-box-focused()

	&:has(.input:disabled)
		input-box-disabled()

	&.invalid
		input-box-invalid()

.input
	input-element-style()

	&.ignore
		pointer-events none
</style>
