<script lang="ts" setup>
import {useFocus} from '@vueuse/core'
import {computed, ref, useTemplateRef, watch} from 'vue'

import {InputEmits} from '../types'
import * as V from '../validator'
import {type InputStringProps} from './types'

const props = withDefaults(defineProps<InputStringProps>(), {
	validator: () => V.identity,
})

const emit = defineEmits<
	Omit<InputEmits<string>, 'focus'> & {focus: [e: FocusEvent]}
>()

const local = ref(props.modelValue)
const validateResult = computed(() => props.validator(local.value))
const validLocal = ref(props.modelValue)

watch(
	validateResult,
	result => {
		if (result.value === undefined) return

		validLocal.value = result.value
		emit('update:modelValue', validLocal.value)
	},
	{flush: 'sync'}
)

const invalid = computed(
	() => props.invalid || validateResult.value.log.length > 0
)

const $input = useTemplateRef('$input')
const {focused} = useFocus($input)

watch(
	() => props.modelValue,
	value => {
		if (focused.value) return

		local.value = value
	},
	{immediate: true, flush: 'sync'}
)

function onFocus(e: FocusEvent) {
	emit('focus', e)
}

function onInput(e: Event) {
	const newValue = (e.target as HTMLInputElement).value
	local.value = newValue
}

function confirm() {
	local.value = validLocal.value

	emit('confirm')
}

function onBlur() {
	confirm()
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
		:value="local"
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
		@keydown.enter="confirm"
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
