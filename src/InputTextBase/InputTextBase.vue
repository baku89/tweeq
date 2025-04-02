<script lang="ts" setup>
import {computed, useTemplateRef} from 'vue'

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

const slots = defineSlots<{
	back: () => any
	front: () => any
	inactiveContent: () => any
}>()

defineExpose({
	select: (start?: number, end?: number) => {
		if (start === undefined) {
			$input.value?.select()
		} else {
			$input.value?.setSelectionRange(start, end ?? start + 1)
			$input.value?.focus()
		}
	},
})

const hasInactiveContent = computed(() => !!slots.inactiveContent)

const $input = useTemplateRef('$input')

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
		:class="{
			active,
			invalid,
			hover,
		}"
		:theme="theme"
		:font="font"
		:align="align"
		:inline-position="inlinePosition"
		:block-position="blockPosition"
	>
		<slot name="back" />
		<input
			ref="$input"
			class="input"
			type="text"
			:class="{ignore: ignoreInput, 'has-inactive-content': hasInactiveContent}"
			:value="model"
			:disabled="disabled || undefined"
			@focus="onFocus"
			@blur="onBlur"
			@input="onInput"
			@keydown="emit('keydown', $event)"
			@keydown.enter="emit('confirm')"
		/>

		<div v-if="hasInactiveContent" class="inactive-content">
			<slot name="inactiveContent" />
		</div>

		<Icon v-if="leftIcon" class="icon left" :icon="leftIcon" />
		<Icon v-if="rightIcon" class="icon right" :icon="rightIcon" />

		<slot name="front" />
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqInputTextBase
	position relative
	height var(--tq-input-height)
	border-radius var(--tq-radius-input)
	background var(--tq-color-input)
	color var(--tq-color-text)
	hover-transition(background, box-shadow)
	flex-grow 1
	overflow hidden
	container-type inline-size

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

.input, .inactive-content
	position absolute
	inset 0 .5em
	overflow-x visible

	.TqInputTextBase:has(.icon.left) &
		left calc(var(--tq-icon-size))

	.TqInputTextBase:has(.icon.right) &
		right calc(var(--tq-icon-size))

.input
	height var(--tq-input-height)

	@container (max-width: 100px)
		&
			padding-inline 0

	&.has-inactive-content:not(:focus)
		opacity 0

	&.ignore
		pointer-events none

.inactive-content
	pointer-events none

	& > *
		pointer-events auto


	:focus + &
		display none


.icon
	margin calc((var(--tq-input-height) - var(--tq-icon-size)) / 2)
	color var(--tq-color-text-mute)
	transform scale(0.8)
	opacity .7
	position absolute
	z-index 100
	pointer-events none
	top 0

	&.left
		left 2px

	&.right
		right 2px
</style>
