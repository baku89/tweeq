<script lang="ts" setup>
import {useTemplateRef} from 'vue'

import {Icon} from '../Icon'
import {
	type InputAlign,
	type InputBoxProps,
	type InputFont,
	type InputTheme,
} from '../types'

export interface InputTextBaseProps extends InputBoxProps {
	ignoreInput?: boolean
	hover?: boolean
	active?: boolean
	theme?: InputTheme
	font?: InputFont
	align?: InputAlign
	leftIcon?: string
	rightIcon?: string
}

const model = defineModel<string>({required: true})

defineProps<InputTextBaseProps>()

const emit = defineEmits<{
	focus: [e: FocusEvent]
	blur: [e: FocusEvent]
	keydown: [e: KeyboardEvent]
	confirm: []
	'update:focused': [value: boolean]
}>()

const $input = useTemplateRef('$input')

defineExpose({
	select: () => {
		$input.value?.select()
	},
})

function onInput(e: Event) {
	model.value = (e.target as HTMLInputElement).value
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
			:value="model"
			:inline-position="inlinePosition"
			:block-position="blockPosition"
			:disabled="disabled || undefined"
			@focus="onFocus"
			@blur="onBlur"
			@input="onInput"
			@keydown="emit('keydown', $event)"
			@keydown.enter="emit('confirm')"
		/>

		<Icon v-if="leftIcon" class="icon left" :icon="leftIcon" />
		<Icon v-if="rightIcon" class="icon right" :icon="rightIcon" />

		<slot name="front" />
	</div>
</template>

<style lang="stylus" scoped>
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


.icon
	width calc(var(--tq-input-height) - 6px)
	height calc(var(--tq-input-height) - 6px)
	margin 3px
	color var(--tq-color-text-mute)
	transform scale(0.8)
	opacity .7
	position absolute
	z-index 100
	pointer-events none
	top 0

	&.left
		left 3px

	&.right
		right 3px
</style>
