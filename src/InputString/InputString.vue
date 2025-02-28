<script lang="ts" setup>
import {type MaybeElementRef, useFocus} from '@vueuse/core'
import {identity} from 'lodash-es'
import {ref, ref as shallowRef, watch} from 'vue'

import {type InputStringProps} from './types'

const props = withDefaults(defineProps<InputStringProps>(), {
	validator: () => identity,
})

const display = ref(props.modelValue)
const $input: MaybeElementRef = shallowRef(null)
const focusing = useFocus($input).focused

watch(
	() => [focusing.value, props.modelValue] as const,
	([focusing, modelValue]) => {
		if (focusing) {
			if (props.forceUpdateOnFocusing) {
				display.value = modelValue
			}
		} else {
			display.value = modelValue
		}
	},
	{immediate: true}
)

const emit = defineEmits<{
	'update:modelValue': [string]
	focus: [e: Event]
	blur: [e: Event]
	input: [e: Event]
}>()

function onFocus(e: Event) {
	;(e.target as HTMLInputElement).select()
	emit('focus', e)
}

function onInput(e: Event) {
	const newValue = (e.target as HTMLInputElement).value
	display.value = newValue

	const validatedValue = props.validator(newValue)

	if (validatedValue !== undefined) {
		emit('update:modelValue', validatedValue)
	}

	emit('input', e)
}

function onBlur(e: Event) {
	emit('blur', e)
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
		/>
	</div>
</template>

<style lang="stylus">
@import '../common.styl'

.InputString
	input-style()
</style>
