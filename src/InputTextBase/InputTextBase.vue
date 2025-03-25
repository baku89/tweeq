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
	hover?: boolean
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
		:class="{active, invalid, hover}"
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
	position relative
	width 100%
	height var(--tq-input-height)
	border-radius var(--tq-input-border-radius)
	background var(--tq-color-input)
	color var(--tq-color-text)
	hover-transition(background, box-shadow)
	overflow hidden

	use-input-font()
	use-input-align()
	use-input-position()
	use-input-theme()

	// Hover
	&:hover, &.hover
		background var(--tq-color-input-hover)

	// Focused
	&:focus-within, &.active
		z-index 1
		box-shadow 0 0 0 1px var(--tq-color-accent)

	// Disabled
	&:has(.input:disabled)
		background transparent
		--tq-color-accent var(--tq-color-text-border)
		--tq-color-accent-soft var(--tq-color-border-subtle)
		--tq-color-text var(--tq-color-text-mute)
		box-shadow inset 0 0 0 1px var(--tq-color-border)

	// Invalid
	&.invalid
		--tq-color-text var(--tq-color-error)

.input
	position relative
	width 100%
	height var(--tq-input-height)
	padding-inline .5em

	&.ignore
		pointer-events none
</style>
